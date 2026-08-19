import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface GlobalStats {
  total_members: number;
  total_countries: number;
  top_countries: Array<{ country_code: string; member_count: number }>;
}

// Cache for 60 seconds — recalculating millions of rows on every request is wasteful
let cache: { data: GlobalStats; at: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  const admin = createAdminClient();

  // Total members
  const { count: total_members } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  // Country breakdown (only members who have set country)
  const { data: countriesRaw } = await admin
    .from("profiles")
    .select("country_code")
    .not("country_code", "is", null);

  const countMap: Record<string, number> = {};
  for (const row of (countriesRaw ?? []) as Array<{ country_code: string }>) {
    countMap[row.country_code] = (countMap[row.country_code] ?? 0) + 1;
  }

  const top_countries = Object.entries(countMap)
    .map(([country_code, member_count]) => ({ country_code, member_count }))
    .sort((a, b) => b.member_count - a.member_count)
    .slice(0, 30);

  const result: GlobalStats = {
    total_members: total_members ?? 0,
    total_countries: top_countries.length,
    top_countries,
  };

  cache = { data: result, at: now };
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
