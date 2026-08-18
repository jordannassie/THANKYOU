/**
 * GET /api/vision/job/[jobId]
 *
 * Polls a generation job's status.
 *
 * If the job is still "processing", this route checks FAL's queue for the
 * latest status. When FAL marks it COMPLETED it downloads the image,
 * uploads it to Supabase Storage, creates a vision_board_images record,
 * and marks the job as "completed" — all within a single poll call.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fal } from "@fal-ai/client";
import { randomUUID } from "crypto";

const FAL_MODEL    = "fal-ai/flux/dev";
const STORAGE_BUCKET = "STORAGE";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  // ── Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // ── Fetch job ─────────────────────────────────────────────────────────
  const { data: job, error: fetchErr } = await admin
    .from("vision_generation_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id) // ownership guard
    .maybeSingle();

  if (fetchErr) {
    console.error("[vision/job] DB fetch error:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // ── Already done ──────────────────────────────────────────────────────
  if (job.status === "completed" || job.status === "failed") {
    return NextResponse.json(job);
  }

  // ── Check FAL queue status ────────────────────────────────────────────
  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY || !job.fal_request_id) {
    // Can't check — return current DB status
    return NextResponse.json(job);
  }

  fal.config({ credentials: FAL_KEY });

  try {
    const queueStatus = await fal.queue.status(FAL_MODEL, {
      requestId: job.fal_request_id as string,
      logs: false,
    });

    const falStatus = (queueStatus as unknown as { status: string }).status;
    console.log(`[vision/job] Job ${jobId} FAL status: ${falStatus}`);

    // ── FAL completed → download, upload, record ─────────────────────
    if (falStatus === "COMPLETED") {
      const result = await fal.queue.result(FAL_MODEL, {
        requestId: job.fal_request_id as string,
      });

      const falData = result.data as { images?: { url: string }[] };
      const imageUrl = falData?.images?.[0]?.url;

      if (!imageUrl) throw new Error("FAL result contained no image URL");

      // Download from FAL CDN
      console.log(`[vision/job] Job ${jobId}: downloading from FAL CDN`);
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`CDN download failed: ${imgRes.status}`);
      const imageBuffer = Buffer.from(await imgRes.arrayBuffer());

      // Upload to Supabase Storage
      const imageId     = randomUUID();
      const storagePath = `vision-board/${user.id}/generated/${imageId}.jpg`;

      console.log(`[vision/job] Job ${jobId}: uploading to ${storagePath}`);
      const { error: uploadErr } = await admin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, imageBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

      const { data: { publicUrl } } = admin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

      // Insert vision_board_images record
      const { error: insertErr } = await admin.from("vision_board_images").insert({
        user_id:      user.id,
        image_url:    publicUrl,
        storage_path: storagePath,
        prompt:       job.prompt,
        source:       "generated",
      });

      if (insertErr) throw new Error(`DB insert failed: ${insertErr.message}`);

      // Mark job completed
      await admin
        .from("vision_generation_jobs")
        .update({ status: "completed", image_path: storagePath, updated_at: new Date().toISOString() })
        .eq("id", jobId);

      console.log(`[vision/job] Job ${jobId}: COMPLETE ✓`);
      return NextResponse.json({ ...job, status: "completed" });
    }

    // ── FAL failed ───────────────────────────────────────────────────
    if (falStatus === "FAILED") {
      const errMsg = "Image generation failed. Please try again.";
      await admin
        .from("vision_generation_jobs")
        .update({ status: "failed", error_message: errMsg, updated_at: new Date().toISOString() })
        .eq("id", jobId);

      return NextResponse.json({ ...job, status: "failed", error_message: errMsg });
    }

    // ── Still queued / in progress ────────────────────────────────────
    return NextResponse.json({ ...job, status: "processing" });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[vision/job] Error processing job ${jobId}:`, msg);

    // Mark as failed so the user knows something went wrong
    await admin
      .from("vision_generation_jobs")
      .update({ status: "failed", error_message: msg, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    return NextResponse.json({ ...job, status: "failed", error_message: msg });
  }
}
