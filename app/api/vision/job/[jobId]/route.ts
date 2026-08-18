/**
 * GET /api/vision/job/[jobId]
 *
 * Returns the current status of a vision-generation job.
 * The actual image generation happens in the Netlify Background Function
 * (vision-generate-background.ts), which updates this DB record when done.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // ── Read job ──────────────────────────────────────────────────────────
  const admin = createAdminClient();

  const { data: job, error } = await admin
    .from("vision_generation_jobs")
    .select("id, status, error_message, created_at")
    .eq("id", jobId)
    .eq("user_id", user.id) // ownership guard
    .maybeSingle();

  if (error) {
    console.error("[vision/job] DB error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
