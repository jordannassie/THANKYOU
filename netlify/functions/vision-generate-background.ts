/**
 * Netlify Background Function — Vision Image Generation (OpenAI gpt-image-2)
 *
 * The "-background" filename suffix makes Netlify return 202 immediately and
 * run this handler for up to 15 minutes.
 * URL: /.netlify/functions/vision-generate-background
 *
 * Auth: we skip Bearer-token verification here. The jobId is a UUID that was
 * just created by an authenticated /api/vision/start call and returned only to
 * that user. The user_id for saving comes from the existing job record in DB
 * (not from the request), so there is no privilege escalation risk.
 *
 * IMPORTANT: every early-return path must try to mark the job "failed" so the
 * frontend polling never loops forever on a stuck "processing" status.
 */

import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import ws from "ws";

// ── Environment ─────────────────────────────────────────────────────────
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL        ?? "";
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY       ?? "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY                  ?? "";
const STORAGE_BUCKET = "STORAGE";

const SYSTEM_PREFIX =
  "Create an inspiring, aspirational vision-board image. " +
  "Make it visually beautiful, realistic, premium, uplifting and photographic " +
  "unless the user requests another style. " +
  "Do not add text, quotes, captions, logos or watermarks unless the user specifically asks for text. " +
  "User's vision: ";

// ── Supabase admin client ────────────────────────────────────────────────
// @supabase/supabase-js 2.112+ requires Node 22+ for native WebSocket.
// Netlify Functions run Node 20, so we supply the `ws` package as the
// Realtime transport. We never actually use Realtime — this only prevents
// the constructor crash.
function adminDB() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createSupabaseClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    realtime: { transport: ws as any },
  });
}

// ── Update job helper ───────────────────────────────────────────────────
async function failJob(jobId: string, message: string) {
  console.error(`[vision-bg] FAIL — Job ${jobId}: ${message}`);
  const db = adminDB();
  if (!db) { console.error("[vision-bg] Cannot fail job — DB client unavailable"); return; }
  const { error } = await db
    .from("vision_generation_jobs")
    .update({ status: "failed", error_message: message, updated_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) console.error("[vision-bg] failJob DB error:", error.message);
}

// ── Handler ──────────────────────────────────────────────────────────────
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let jobId  = "";
  let prompt = "";
  try {
    const body = JSON.parse(event.body ?? "{}") as { jobId?: string; prompt?: string };
    jobId  = (body.jobId  ?? "").trim();
    prompt = (body.prompt ?? "").trim();
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!jobId || !prompt) {
    return { statusCode: 400, body: "Missing jobId or prompt" };
  }

  console.log(`[vision-bg] Node version: ${process.version}`);
  console.log(`[vision-bg] START — Job ${jobId}`);

  // ── Validate environment ────────────────────────────────────────────────
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[vision-bg] Missing Supabase env vars");
    // Can't update DB — just log and return
    return { statusCode: 500, body: "Supabase env not configured" };
  }

  if (!OPENAI_API_KEY) {
    await failJob(jobId, "OPENAI_API_KEY is not set on this server. Add it in Netlify → Site configuration → Environment variables.");
    return { statusCode: 500, body: "OPENAI_API_KEY not set" };
  }

  const db = adminDB()!;

  // ── Verify job exists ──────────────────────────────────────────────────
  const { data: job, error: jobErr } = await db
    .from("vision_generation_jobs")
    .select("id, user_id, status")
    .eq("id", jobId)
    .maybeSingle();

  if (jobErr || !job) {
    console.error(`[vision-bg] Job ${jobId} not found:`, jobErr?.message);
    return { statusCode: 404, body: "Job not found" };
  }

  if (job.status === "completed" || job.status === "failed") {
    console.log(`[vision-bg] Job ${jobId} already ${job.status} — skipping`);
    return { statusCode: 200, body: "Already done" };
  }

  // ── Call OpenAI gpt-image-2 ────────────────────────────────────────────
  console.log(`[vision-bg] Job ${jobId}: job loaded`);

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  let imageBuffer: Buffer;

  try {
    const openaiStart = Date.now();
    console.log(`[vision-bg] Job ${jobId}: OpenAI request started`);

    const result = await openai.images.generate({
      model:         "gpt-image-2",
      prompt:        SYSTEM_PREFIX + prompt,
      size:          "1024x1024",
      quality:       "medium",
      output_format: "jpeg",
      n:             1,
    });

    const openaiMs = Date.now() - openaiStart;
    console.log(`[vision-bg] Job ${jobId}: OpenAI request completed in ${openaiMs}ms`);

    // Inspect what the SDK returned
    const dataLen = result.data?.length ?? 0;
    console.log(`[vision-bg] Job ${jobId}: result.data length = ${dataLen}`);

    const imageData = result.data?.[0];
    if (!imageData) {
      throw new Error(
        `OpenAI returned no image data (data array length: ${dataLen})`
      );
    }

    const hasB64  = !!imageData.b64_json;
    const hasUrl  = !!imageData.url;
    console.log(`[vision-bg] Job ${jobId}: image data — b64_json: ${hasB64}, url: ${hasUrl}`);

    if (imageData.b64_json) {
      console.log(`[vision-bg] Job ${jobId}: Image base64 received (${imageData.b64_json.length} chars)`);
      imageBuffer = Buffer.from(imageData.b64_json, "base64");
      console.log(`[vision-bg] Job ${jobId}: Image converted to buffer (${imageBuffer.length} bytes)`);
    } else if (imageData.url) {
      console.log(`[vision-bg] Job ${jobId}: Image URL received — downloading`);
      const r = await fetch(imageData.url);
      if (!r.ok) throw new Error(`URL download failed: ${r.status} ${r.statusText}`);
      imageBuffer = Buffer.from(await r.arrayBuffer());
      console.log(`[vision-bg] Job ${jobId}: Image converted to buffer (${imageBuffer.length} bytes)`);
    } else {
      throw new Error("OpenAI returned neither b64_json nor url in data[0]");
    }
  } catch (err) {
    // Log the full error for diagnosis
    const name    = err instanceof Error ? err.name    : "UnknownError";
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status  = (err as any)?.status ?? (err as any)?.statusCode ?? "n/a";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code    = (err as any)?.error?.code ?? (err as any)?.code ?? "n/a";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type    = (err as any)?.error?.type ?? "n/a";
    const stack   = err instanceof Error ? (err.stack ?? "no stack") : "no stack";

    console.error(`[vision-bg] Job ${jobId}: OpenAI ERROR`);
    console.error(`  name:    ${name}`);
    console.error(`  message: ${message}`);
    console.error(`  status:  ${status}`);
    console.error(`  code:    ${code}`);
    console.error(`  type:    ${type}`);
    console.error(`  stack:   ${stack}`);

    await failJob(jobId, `OpenAI error (${status}): ${message}`);
    return { statusCode: 500, body: message };
  }

  // ── Upload to Supabase Storage ──────────────────────────────────────────
  const imageId     = randomUUID();
  const storagePath = `vision-board/${job.user_id}/generated/${imageId}.jpg`;

  console.log(`[vision-bg] Job ${jobId}: Supabase upload started → ${STORAGE_BUCKET}/${storagePath}`);

  try {
    const { error: uploadErr } = await db.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, imageBuffer, { contentType: "image/jpeg", upsert: false });

    if (uploadErr) throw new Error(`Storage upload: ${uploadErr.message}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    console.error(`[vision-bg] Job ${jobId}: upload error: ${msg}`);
    await failJob(jobId, msg);
    return { statusCode: 500, body: msg };
  }

  const { data: { publicUrl } } = db.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  console.log(`[vision-bg] Job ${jobId}: Supabase upload completed → ${publicUrl}`);

  // ── Insert vision_board_images ──────────────────────────────────────────
  const { error: insertErr } = await db.from("vision_board_images").insert({
    user_id:      job.user_id,
    image_url:    publicUrl,
    storage_path: storagePath,
    prompt,
    source:       "generated",
  });

  if (insertErr) {
    console.error(`[vision-bg] Job ${jobId}: vision_board_images insert error: ${insertErr.message}`);
    await failJob(jobId, `DB insert: ${insertErr.message}`);
    return { statusCode: 500, body: insertErr.message };
  }

  // ── Mark job completed ──────────────────────────────────────────────────
  const { error: updateErr } = await db
    .from("vision_generation_jobs")
    .update({ status: "completed", image_path: storagePath, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (updateErr) {
    console.error(`[vision-bg] Job ${jobId}: complete-update error: ${updateErr.message}`);
  }

  console.log(`[vision-bg] Job ${jobId}: job marked completed ✓`);
  return { statusCode: 200, body: "OK" };
};
