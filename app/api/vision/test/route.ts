/**
 * GET /api/vision/test
 *
 * Quick diagnostic endpoint — checks all config needed for image generation.
 * Admin-only (checks for admin cookie or authenticated user).
 * Visit this URL directly in the browser to see what's configured.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("ty_admin_code")?.value === "1234";

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only — set code 1234 first" }, { status: 403 });
  }

  const checks: Record<string, string> = {};

  // ── OpenAI ───────────────────────────────────────────────────────────
  const openaiKey = process.env.OPENAI_API_KEY ?? "";
  checks.OPENAI_API_KEY = openaiKey
    ? `✓ set (${openaiKey.slice(0, 8)}...)`
    : "✗ MISSING — add to Netlify env vars";

  // ── Supabase ─────────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  checks.NEXT_PUBLIC_SUPABASE_URL      = supabaseUrl  ? `✓ ${supabaseUrl}` : "✗ MISSING";
  checks.SUPABASE_SERVICE_ROLE_KEY     = serviceKey   ? `✓ set (${serviceKey.slice(0, 8)}...)` : "✗ MISSING";
  checks.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "")
      ? "✓ set"
      : "✗ MISSING";

  // ── DB table ──────────────────────────────────────────────────────────
  let tableStatus = "unknown";
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("vision_generation_jobs")
      .select("id")
      .limit(1);
    tableStatus = error ? `✗ ERROR: ${error.message}` : "✓ exists";
  } catch (e) {
    tableStatus = `✗ EXCEPTION: ${e instanceof Error ? e.message : "unknown"}`;
  }
  checks.vision_generation_jobs_table = tableStatus;

  // ── Storage bucket ────────────────────────────────────────────────────
  let storageStatus = "unknown";
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.getBucket("STORAGE");
    storageStatus = error ? `✗ ${error.message}` : `✓ exists (public: ${data?.public})`;
  } catch (e) {
    storageStatus = `✗ EXCEPTION: ${e instanceof Error ? e.message : "unknown"}`;
  }
  checks.STORAGE_bucket = storageStatus;

  const allGood = Object.values(checks).every((v) => v.startsWith("✓"));

  return NextResponse.json(
    {
      status: allGood ? "ALL GOOD — image generation should work" : "ISSUES FOUND — see checks below",
      checks,
      next_step: allGood
        ? "Try generating again. Check Netlify Function Logs if it still fails."
        : "Fix the ✗ items above, then re-deploy.",
    },
    { status: 200 }
  );
}
