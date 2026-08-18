/**
 * GET /api/vision/job/[jobId]
 *
 * Poll the status of a vision generation job.
 * Returns job status (pending | processing | completed | failed)
 * and error_message when failed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  // Verify the requesting user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the job — use admin client to bypass RLS, but scope to the user
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("vision_generation_jobs")
    .select("id, status, error_message, image_path, updated_at")
    .eq("id", jobId)
    .eq("user_id", user.id) // ensure the job belongs to this user
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!job) {
    // Not found or doesn't belong to this user
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
