/**
 * Netlify Background Function — Vision Image Generation (OpenAI gpt-image-2)
 *
 * The filename suffix "-background" makes Netlify return 202 immediately and
 * run this handler asynchronously for up to 15 minutes.
 * URL: /.netlify/functions/vision-generate-background
 *
 * IMPORTANT: The job record is created by /api/vision/start *before* the
 * client fires this function, so the status endpoint always finds the job.
 *
 * Flow:
 *  1. Verify Bearer token → get user
 *  2. Find existing job (ownership check: job.user_id === user.id)
 *  3. Call OpenAI gpt-image-2
 *  4. Upload result to Supabase Storage
 *  5. Insert vision_board_images record
 *  6. Update job → completed | failed
 */

import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ── Environment ────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY    = process.env.OPENAI_API_KEY!;

const STORAGE_BUCKET = "STORAGE";

const SYSTEM_PREFIX =
  "Create an inspiring, aspirational vision-board image. " +
  "Make it visually beautiful, realistic, premium, uplifting and photographic " +
  "unless the user requests another style. " +
  "Do not add text, quotes, captions, logos or watermarks unless the user specifically asks for text. " +
  "User's vision: ";

// ── Supabase helpers ───────────────────────────────────────────────────
function adminDB() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function anonDB() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function updateJob(
  db: ReturnType<typeof adminDB>,
  jobId: string,
  fields: Record<string, unknown>
) {
  const { error } = await db
    .from("vision_generation_jobs")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) console.error(`[vision-bg] updateJob error:`, error.message);
}

// ── Handler ────────────────────────────────────────────────────────────
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // ── Parse body ──────────────────────────────────────────────────────
  let jobId = "";
  let prompt = "";
  try {
    const body = JSON.parse(event.body ?? "{}") as {
      jobId?: string;
      prompt?: string;
    };
    jobId  = (body.jobId  ?? "").trim();
    prompt = (body.prompt ?? "").trim();
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!jobId || !prompt) {
    return { statusCode: 400, body: "Missing jobId or prompt" };
  }

  // ── Verify user from Bearer token ────────────────────────────────────
  const authHeader = event.headers["authorization"] ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    return { statusCode: 401, body: "Missing token" };
  }

  const userClient = anonDB();
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser(accessToken);

  if (authErr || !user) {
    console.error(`[vision-bg] Auth error:`, authErr?.message);
    return { statusCode: 401, body: "Unauthorized" };
  }

  const db = adminDB();

  // ── Find existing job ─────────────────────────────────────────────────
  const { data: job, error: jobErr } = await db
    .from("vision_generation_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (jobErr || !job) {
    console.error(`[vision-bg] Job ${jobId} not found:`, jobErr?.message);
    return { statusCode: 404, body: "Job not found" };
  }

  if (job.user_id !== user.id) {
    console.error(`[vision-bg] Ownership mismatch for job ${jobId}`);
    return { statusCode: 403, body: "Forbidden" };
  }

  // ── Validate OpenAI key ───────────────────────────────────────────────
  if (!OPENAI_API_KEY) {
    console.error(`[vision-bg] OPENAI_API_KEY not set`);
    await updateJob(db, jobId, {
      status: "failed",
      error_message: "Image generation is not configured (missing OPENAI_API_KEY).",
    });
    return { statusCode: 500, body: "OPENAI_API_KEY not set" };
  }

  // ── Call OpenAI gpt-image-2 ────────────────────────────────────────────
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const fullPrompt = SYSTEM_PREFIX + prompt;

  console.log(`[vision-bg] Job ${jobId}: calling OpenAI gpt-image-2`);

  let imageBuffer: Buffer;
  try {
    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt: fullPrompt,
      size: "1024x1024",
      quality: "medium",
      n: 1,
    });

    console.log(`[vision-bg] Job ${jobId}: OpenAI responded`);

    const imageData = result.data?.[0];
    if (!imageData) throw new Error("OpenAI returned no image data");

    // gpt-image-2 returns b64_json or url depending on SDK version
    if (imageData.b64_json) {
      imageBuffer = Buffer.from(imageData.b64_json, "base64");
    } else if (imageData.url) {
      console.log(`[vision-bg] Job ${jobId}: downloading from OpenAI URL`);
      const r = await fetch(imageData.url);
      if (!r.ok) throw new Error(`URL download failed: ${r.status}`);
      imageBuffer = Buffer.from(await r.arrayBuffer());
    } else {
      throw new Error("OpenAI returned neither b64_json nor url");
    }

    console.log(
      `[vision-bg] Job ${jobId}: image received (${imageBuffer.length} bytes)`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OpenAI generation failed";
    console.error(`[vision-bg] Job ${jobId} OpenAI error:`, msg);
    await updateJob(db, jobId, { status: "failed", error_message: msg });
    return { statusCode: 500, body: msg };
  }

  // ── Upload to Supabase Storage ─────────────────────────────────────────
  const { randomUUID } = await import("crypto");
  const imageId     = randomUUID();
  const storagePath = `vision-board/${user.id}/generated/${imageId}.jpg`;

  console.log(`[vision-bg] Job ${jobId}: uploading to ${STORAGE_BUCKET}/${storagePath}`);

  try {
    const { error: uploadErr } = await db.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, imageBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadErr) throw new Error(`Storage upload: ${uploadErr.message}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    console.error(`[vision-bg] Job ${jobId} upload error:`, msg);
    await updateJob(db, jobId, { status: "failed", error_message: msg });
    return { statusCode: 500, body: msg };
  }

  const { data: { publicUrl } } = db.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  // ── Insert vision_board_images record ──────────────────────────────────
  const { error: insertErr } = await db.from("vision_board_images").insert({
    user_id:      user.id,
    image_url:    publicUrl,
    storage_path: storagePath,
    prompt,
    source:       "generated",
  });

  if (insertErr) {
    console.error(
      `[vision-bg] Job ${jobId} vision_board_images insert error:`,
      insertErr.message
    );
    await updateJob(db, jobId, {
      status: "failed",
      error_message: `DB insert: ${insertErr.message}`,
    });
    return { statusCode: 500, body: insertErr.message };
  }

  // ── Mark job completed ─────────────────────────────────────────────────
  await updateJob(db, jobId, {
    status: "completed",
    image_path: storagePath,
  });

  console.log(`[vision-bg] Job ${jobId}: COMPLETE ✓`);
  return { statusCode: 200, body: "OK" };
};
