/**
 * POST /api/vision/start
 *
 * Creates a vision-generation job record and returns the jobId immediately
 * (~200 ms). The caller then separately fires the background function to do
 * the actual OpenAI work.
 *
 * Splitting the two steps means polling always finds the job in the DB from
 * the first poll — the old bug was that the job was created *inside* the
 * background function, which ran after the 202 response, so early polls got
 * 404 and re-polled silently forever.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  // ── Create job ────────────────────────────────────────────────────────
  const jobId = randomUUID();
  const admin = createAdminClient();

  const { error: dbErr } = await admin.from("vision_generation_jobs").insert({
    id: jobId,
    user_id: user.id,
    prompt,
    status: "processing",
  });

  if (dbErr) {
    console.error("[vision/start] DB insert error:", dbErr.message, dbErr.details);
    return NextResponse.json(
      {
        error:
          `Database error: ${dbErr.message}. Have you run the SQL migration (006_vision_jobs_fal.sql)?`,
      },
      { status: 500 }
    );
  }

  // Get a short-lived access token so the background function can verify ownership
  const { data: { session } } = await supabase.auth.getSession();

  console.log(`[vision/start] Job ${jobId} created for user ${user.id}`);

  return NextResponse.json({
    jobId,
    accessToken: session?.access_token ?? "",
  });
}
