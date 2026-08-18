/**
 * Netlify Background Function — Vision Image Generation
 *
 * The filename suffix "-background" tells Netlify this is a Background Function.
 * Netlify immediately returns 202 to the caller; this handler runs up to 15 min.
 * Accessible at: /.netlify/functions/vision-generate-background
 *
 * Flow:
 *  1. Verify user from Bearer token
 *  2. Create / update job record (status: processing)
 *  3. Call OpenAI gpt-image-2
 *  4. Convert base64 → Buffer → upload to Supabase Storage
 *  5. Insert vision_board_images record
 *  6. Update job (status: completed | failed)
 */

import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { randomUUID } from "crypto";

// ── Environment ────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY    = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY!;

const STORAGE_BUCKET = "vision-board";
const MODEL          = "gpt-image-2";
const SIZE           = "1024x1024" as const;
const QUALITY        = "medium" as const;

const SYSTEM_PREFIX = `Create an inspiring, aspirational vision-board image.
Make it visually beautiful, realistic, premium, uplifting and photographic unless the user requests another style.
Do not add text, quotes, captions, logos or watermarks unless the user specifically asks for text.
User's vision: `;

// ── Admin Supabase client (bypasses RLS — server-only) ─────────────────
function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Update job helper ──────────────────────────────────────────────────
async function updateJob(
  db: ReturnType<typeof adminClient>,
  jobId: string,
  fields: Record<string, unknown>
) {
  await db
    .from("vision_generation_jobs")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

// ── Handler ────────────────────────────────────────────────────────────
export const handler: Handler = async (event: HandlerEvent) => {
  // ── 1. Parse body ───────────────────────────────────────────────────
  let body: { jobId?: string; prompt?: string } = {};
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    console.error("[vision-bg] Failed to parse request body");
    return { statusCode: 400, body: "Bad request" };
  }

  const { jobId, prompt } = body;

  if (!jobId || !prompt) {
    console.error("[vision-bg] Missing jobId or prompt");
    return { statusCode: 400, body: "Missing jobId or prompt" };
  }

  console.log(`[vision-bg] Job ${jobId} started`);

  // ── 2. Authenticate user ────────────────────────────────────────────
  const authHeader = event.headers["authorization"] ?? event.headers["Authorization"] ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    console.error(`[vision-bg] Job ${jobId}: no auth token`);
    return { statusCode: 401, body: "Unauthorized" };
  }

  // Verify token with Supabase anon client
  const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authErr } = await anonSupabase.auth.getUser(accessToken);

  if (authErr || !user) {
    console.error(`[vision-bg] Job ${jobId}: auth failed`, authErr?.message);
    return { statusCode: 401, body: "Unauthorized" };
  }

  console.log(`[vision-bg] Job ${jobId}: authenticated user ${user.id}`);

  const db = adminClient();

  // ── 3. Create job record ────────────────────────────────────────────
  const { error: insertErr } = await db
    .from("vision_generation_jobs")
    .insert({
      id:      jobId,
      user_id: user.id,
      prompt,
      status:  "processing",
    });

  if (insertErr) {
    // Job might already exist (retry) — try to update instead
    await updateJob(db, jobId, { status: "processing" });
  }

  // ── 4. Check environment ────────────────────────────────────────────
  if (!OPENAI_API_KEY) {
    console.error(`[vision-bg] Job ${jobId}: OPENAI_API_KEY not set`);
    await updateJob(db, jobId, {
      status: "failed",
      error_message: "Image generation is not configured (missing API key).",
    });
    return { statusCode: 500, body: "OPENAI_API_KEY not set" };
  }

  // ── 5. Call OpenAI ──────────────────────────────────────────────────
  console.log(`[vision-bg] Job ${jobId}: calling OpenAI ${MODEL}`);

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  let imageBase64: string;

  try {
    const response = await openai.images.generate({
      model:   MODEL,
      prompt:  SYSTEM_PREFIX + prompt,
      n:       1,
      size:    SIZE,
      quality: QUALITY,
      // gpt-image-2 always returns b64_json — no response_format param
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned no image data.");
    imageBase64 = b64;

    console.log(`[vision-bg] Job ${jobId}: OpenAI generation complete`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown OpenAI error";
    console.error(`[vision-bg] Job ${jobId}: OpenAI error:`, msg);

    // Identify transient errors (rate limit / server error) for user-friendly message
    const isTransient =
      msg.includes("429") || msg.includes("500") || msg.includes("503");

    await updateJob(db, jobId, {
      status: "failed",
      error_message: isTransient
        ? "OpenAI is temporarily busy. Please try again in a moment."
        : `Generation failed: ${msg}`,
    });
    return { statusCode: 500, body: msg };
  }

  // ── 6. Upload to Supabase Storage ──────────────────────────────────
  const imageId     = randomUUID();
  const storagePath = `${user.id}/generated/${imageId}.jpg`;
  const imageBuffer = Buffer.from(imageBase64, "base64");

  console.log(`[vision-bg] Job ${jobId}: uploading to storage at ${storagePath}`);

  const { error: uploadError } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, imageBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error(`[vision-bg] Job ${jobId}: storage error:`, uploadError.message);
    await updateJob(db, jobId, {
      status: "failed",
      error_message: `Storage upload failed: ${uploadError.message}`,
    });
    return { statusCode: 500, body: uploadError.message };
  }

  console.log(`[vision-bg] Job ${jobId}: storage upload complete`);

  // ── 7. Insert vision_board_images record ───────────────────────────
  const { data: { publicUrl } } = db.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  const { error: dbError } = await db
    .from("vision_board_images")
    .insert({
      user_id:      user.id,
      image_url:    publicUrl,
      storage_path: storagePath,
      prompt,
      source:       "generated",
    });

  if (dbError) {
    console.error(`[vision-bg] Job ${jobId}: DB insert error:`, dbError.message);
    // Best-effort cleanup
    await db.storage.from(STORAGE_BUCKET).remove([storagePath]);
    await updateJob(db, jobId, {
      status: "failed",
      error_message: `Database error: ${dbError.message}`,
    });
    return { statusCode: 500, body: dbError.message };
  }

  // ── 8. Mark job completed ───────────────────────────────────────────
  await updateJob(db, jobId, {
    status:     "completed",
    image_path: storagePath,
  });

  console.log(`[vision-bg] Job ${jobId}: COMPLETE ✓`);
  return { statusCode: 200, body: "OK" };
};
