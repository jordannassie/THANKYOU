import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/invite/attribute
 * Body: { invited_user_id: string; invite_code: string }
 *
 * Called server-side (from the auth callback) to record the referral.
 * Only accepts requests with the SUPABASE_SERVICE_ROLE_KEY header — never exposed to clients.
 * Uses service role so no RLS policy needed for insert.
 */
export async function POST(req: NextRequest) {
  // Internal-only endpoint: verify a shared secret so random browsers can't spam it.
  const auth = req.headers.get("x-internal-key");
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expected || auth !== expected.slice(0, 32)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { invited_user_id?: string; invite_code?: string };
  const { invited_user_id, invite_code } = body;

  if (!invited_user_id || !invite_code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find the inviter from the code
  const { data: inviter } = await admin
    .from("profiles")
    .select("id")
    .eq("invite_code", invite_code)
    .maybeSingle();

  if (!inviter) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Prevent self-referral
  if (inviter.id === invited_user_id) {
    return NextResponse.json({ ok: true, skipped: "self-referral" });
  }

  // Check the invited user isn't already attributed to someone
  const { data: existing } = await admin
    .from("referrals")
    .select("id")
    .eq("invited_user_id", invited_user_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, skipped: "already-attributed" });
  }

  const { error } = await admin.from("referrals").insert({
    inviter_user_id: inviter.id,
    invited_user_id,
    invite_code,
  });

  if (error) {
    // Duplicate key = race condition, treat as success
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, skipped: "duplicate" });
    }
    console.error("[attribute] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
