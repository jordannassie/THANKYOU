import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PATCH /api/admin/users/[id]
 * Updates a user's role and/or membership_status.
 * Requires the calling user to have role = 'admin'.
 * Uses service role client to bypass RLS for the update.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;

  // 1. Verify the requesting user is authenticated and is an admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Parse + validate body
  let body: { role?: string; membership_status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowedRoles = ["user", "admin"];
  const allowedStatuses = ["free", "premium"];

  const update: Record<string, string> = {};
  if (body.role !== undefined) {
    if (!allowedRoles.includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    update.role = body.role;
  }
  if (body.membership_status !== undefined) {
    if (!allowedStatuses.includes(body.membership_status)) {
      return NextResponse.json({ error: "Invalid membership_status" }, { status: 400 });
    }
    update.membership_status = body.membership_status;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // 3. Apply update using service role (bypasses RLS)
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Admin client unavailable. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const { data, error } = await adminClient
    .from("profiles")
    .update(update)
    .eq("id", targetUserId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
