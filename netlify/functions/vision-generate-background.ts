/**
 * Netlify Background Function — Vision Image Generation (FAL AI)
 *
 * The filename suffix "-background" tells Netlify this is a Background Function.
 * Netlify immediately returns 202 to the caller; this handler runs up to 15 min.
 * Accessible at: /.netlify/functions/vision-generate-background
 *
 * Flow:
 *  1. Verify user from Bearer token
 *  2. Create job record (status: processing)
 *  3. Call FAL fal-ai/flux/dev for high-quality image generation
 *  4. Download the returned image → upload to Supabase Storage (permanent)
 *  5. Insert vision_board_images record
 *  6. Update job (status: completed | failed)
 */

import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { fal } from "@fal-ai/client";
import { randomUUID } from "crypto";

// ── Environment ────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY    = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FAL_KEY              = process.env.FAL_KEY!;

const STORAGE_BUCKET = "vision-board";
const FAL_MODEL      = "fal-ai/flux/dev";

const SYSTEM_PREFIX = `Create an inspiring, aspirational vision-board image.
Make it visually beautiful, realistic, premium, uplifting and photographic unless the user requests another style.
Do not add text, quotes, captions, logos or watermarks unless the user specifically asks for text.
User's vision: `;

// ── Admin Supabase client (bypasses RLS — server-only) ─────────────────
function adminClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
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

  const anonSupabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authErr } = await anonSupabase.auth.getUser(accessToken);

  if (authErr || !user) {
    console.error(`[vision-bg] Job ${jobId}: auth failed`, authErr?.message);
    return { statusCode: 401, body: "Unauthorized" };
  }

  console.log(`[vision-bg] Job ${jobId}: authenticated user ${user.id}`);

  const db = adminClient();

  // ── 3. Create / update job record ───────────────────────────────────
  const { error: insertErr } = await db
    .from("vision_generation_jobs")
    .insert({ id: jobId, user_id: user.id, prompt, status: "processing" });

  if (insertErr) {
    // Might already exist on retry — just update status
    await updateJob(db, jobId, { status: "processing" });
  }

  // ── 4. Check environment ────────────────────────────────────────────
  if (!FAL_KEY) {
    console.error(`[vision-bg] Job ${jobId}: FAL_KEY not set`);
    await updateJob(db, jobId, {
      status: "failed",
      error_message: "Image generation is not configured (missing FAL_KEY).",
    });
    return { statusCode: 500, body: "FAL_KEY not set" };
  }

  // ── 5. Call FAL ─────────────────────────────────────────────────────
  console.log(`[vision-bg] Job ${jobId}: calling FAL ${FAL_MODEL}`);

  fal.config({ credentials: FAL_KEY });

  let imageUrl: string;

  try {
    const result = await fal.subscribe(FAL_MODEL, {
      input: {
        prompt: SYSTEM_PREFIX + prompt,
        image_size: "square_hd",   // 1024 × 1024
        num_inference_steps: 28,   // full-quality dev steps
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    const falData = result.data as { images?: { url: string }[] };
    const url = falData?.images?.[0]?.url;
    if (!url) throw new Error("FAL returned no image URL.");
    imageUrl = url;

    console.log(`[vision-bg] Job ${jobId}: FAL generation complete`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown FAL error";
    console.error(`[vision-bg] Job ${jobId}: FAL error:`, msg);

    const isTransient = msg.includes("429") || msg.includes("503") || msg.includes("500");
    await updateJob(db, jobId, {
      status: "failed",
      error_message: isTransient
        ? "The image service is temporarily busy. Please try again in a moment."
        : `Generation failed: ${msg}`,
    });
    return { statusCode: 500, body: msg };
  }

  // ── 6. Download image from FAL CDN ──────────────────────────────────
  console.log(`[vision-bg] Job ${jobId}: downloading image from FAL CDN`);

  let imageBuffer: Buffer;
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`FAL CDN fetch failed: ${imgRes.status}`);
    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Download error";
    console.error(`[vision-bg] Job ${jobId}: download error:`, msg);
    await updateJob(db, jobId, { status: "failed", error_message: msg });
    return { statusCode: 500, body: msg };
  }

  // ── 7. Upload to Supabase Storage ───────────────────────────────────
  const imageId     = randomUUID();
  const storagePath = `${user.id}/generated/${imageId}.jpg`;

  console.log(`[vision-bg] Job ${jobId}: uploading to storage at ${storagePath}`);

  const { error: uploadError } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, imageBuffer, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    console.error(`[vision-bg] Job ${jobId}: storage error:`, uploadError.message);
    await updateJob(db, jobId, {
      status: "failed",
      error_message: `Storage upload failed: ${uploadError.message}`,
    });
    return { statusCode: 500, body: uploadError.message };
  }

  console.log(`[vision-bg] Job ${jobId}: storage upload complete`);

  // ── 8. Insert vision_board_images record ────────────────────────────
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
    await db.storage.from(STORAGE_BUCKET).remove([storagePath]);
    await updateJob(db, jobId, {
      status: "failed",
      error_message: `Database error: ${dbError.message}`,
    });
    return { statusCode: 500, body: dbError.message };
  }

  // ── 9. Mark job completed ───────────────────────────────────────────
  await updateJob(db, jobId, { status: "completed", image_path: storagePath });

  console.log(`[vision-bg] Job ${jobId}: COMPLETE ✓`);
  return { statusCode: 200, body: "OK" };
};
