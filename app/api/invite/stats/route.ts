import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export interface InviteStats {
  invite_code: string | null;
  direct_invites: number;
  total_network: number;
  max_depth: number;
  countries_reached: number;
  direct_members: Array<{
    id: string;
    first_name: string;
    avatar_url: string | null;
    country_code: string | null;
    joined_at: string;
  }>;
  network_countries: Array<{ country_code: string; member_count: number }>;
}

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

  // Invite code
  const { data: profile } = await admin
    .from("profiles")
    .select("invite_code")
    .eq("id", user.id)
    .maybeSingle();

  // Network stats via RPC
  const { data: netStats } = await admin.rpc("get_network_stats", { p_user_id: user.id });
  const stats = Array.isArray(netStats) ? netStats[0] : netStats;

  // Country breakdown
  const { data: countriesRaw } = await admin.rpc("get_network_countries", { p_user_id: user.id });
  const network_countries: Array<{ country_code: string; member_count: number }> =
    (countriesRaw as Array<{ country_code: string; member_count: number }>) ?? [];

  // Direct invite members (first 20, for the network visual)
  const { data: directRefs } = await admin
    .from("referrals")
    .select("invited_user_id, created_at")
    .eq("inviter_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  let direct_members: InviteStats["direct_members"] = [];
  if (directRefs && directRefs.length > 0) {
    const ids = directRefs.map((r) => r.invited_user_id);
    const { data: memberProfiles } = await admin
      .from("profiles")
      .select("id, full_name, avatar_url, country_code")
      .in("id", ids);

    direct_members = (directRefs ?? []).map((ref) => {
      const mp = (memberProfiles ?? []).find((p) => p.id === ref.invited_user_id);
      const fullName = mp?.full_name ?? "";
      return {
        id: ref.invited_user_id,
        first_name: fullName.split(" ")[0] || "Member",
        avatar_url: mp?.avatar_url ?? null,
        country_code: mp?.country_code ?? null,
        joined_at: ref.created_at,
      };
    });
  }

  const result: InviteStats = {
    invite_code: profile?.invite_code ?? null,
    direct_invites: Number(stats?.direct_invites ?? 0),
    total_network: Number(stats?.total_network ?? 0),
    max_depth: Number(stats?.max_depth ?? 0),
    countries_reached: network_countries.length,
    direct_members,
    network_countries,
  };

  return NextResponse.json(result);
}
