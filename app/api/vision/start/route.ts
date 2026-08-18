/**
 * POST /api/vision/start
 *
 * Submits an image generation request to FAL's queue and returns immediately.
 * The job ID is used for subsequent polling via /api/vision/job/[jobId].
 *
 * This replaces the Netlify Background Function approach — FAL's queue handles
 * the async work on their end; we just check status on each poll.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fal } from "@fal-ai/client";
import { randomUUID } from "crypto";

const FAL_MODEL = "fal-ai/flux/dev";

const SYSTEM_PREFIX =
  "Create an inspiring, aspirational vision-board image. " +
  "Make it visually beautiful, realistic, premium, uplifting and photographic unless the user requests another style. " +
  "Do not add text, quotes, captions, logos or watermarks unless the user specifically asks for text. " +
  "User's vision: ";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Input ─────────────────────────────────────────────────────────────
  let prompt = "";
  try {
    const body = await req.json();
    prompt = (body.prompt ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!prompt || prompt.length > 1000) {
    return NextResponse.json(
      { error: "Prompt must be 1–1000 characters" },
      { status: 400 }
    );
  }

  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    return NextResponse.json(
      { error: "Image generation is not configured (missing FAL_KEY)" },
      { status: 500 }
    );
  }

  // ── Submit to FAL queue (~200–400 ms) ─────────────────────────────────
  fal.config({ credentials: FAL_KEY });

  let falRequestId: string;
  try {
    const handle = await fal.queue.submit(FAL_MODEL, {
      input: {
        prompt: SYSTEM_PREFIX + prompt,
        image_size: "square_hd",     // 1024 × 1024
        num_inference_steps: 28,
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    // The FAL SDK returns { request_id } from queue.submit
    falRequestId = (handle as unknown as { request_id: string }).request_id;

    if (!falRequestId) throw new Error("FAL did not return a request_id");

    console.log(`[vision/start] Submitted to FAL queue, request_id: ${falRequestId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "FAL submission failed";
    console.error("[vision/start] FAL submit error:", msg);
    return NextResponse.json({ error: `Submission failed: ${msg}` }, { status: 500 });
  }

  // ── Store job in Supabase ─────────────────────────────────────────────
  const jobId = randomUUID();
  const admin = createAdminClient();

  const { error: dbErr } = await admin.from("vision_generation_jobs").insert({
    id: jobId,
    user_id: user.id,
    prompt,
    status: "processing",
    fal_request_id: falRequestId,
  });

  if (dbErr) {
    console.error("[vision/start] DB insert error:", dbErr.message, dbErr.details);
    // Still return jobId — the poll endpoint will surface the missing table error
    return NextResponse.json(
      { error: `Database error: ${dbErr.message}. Have you run the SQL migration (004_vision_jobs.sql)?` },
      { status: 500 }
    );
  }

  console.log(`[vision/start] Job ${jobId} created, FAL request ${falRequestId}`);

  return NextResponse.json({ jobId });
}
