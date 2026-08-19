import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/invite/code
 * Returns the authenticated user's invite_code.
 * If they don't have one yet, generates one server-side and saves it.
 */
export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list) { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Try to get existing code
  const { data: profile } = await admin
    .from("profiles")
    .select("invite_code")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.invite_code) {
    return NextResponse.json({ invite_code: profile.invite_code });
  }

  // Generate a new code via DB function
  const { data: generated, error: genErr } = await admin.rpc("generate_invite_code");
  if (genErr || !generated) {
    return NextResponse.json({ error: "Failed to generate invite code" }, { status: 500 });
  }

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ invite_code: generated })
    .eq("id", user.id);

  if (updateErr) {
    return NextResponse.json({ error: "Failed to save invite code" }, { status: 500 });
  }

  return NextResponse.json({ invite_code: generated });
}
