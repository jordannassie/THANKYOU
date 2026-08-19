import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StreakData {
  streak: number;
  /** Mon=0 … Sun=6, true if checked in that day */
  week: boolean[];
  /** Which index (0-6) is today */
  todayIndex: number;
}

/** Today's date string in the user's local timezone passed via header, else UTC */
function todayStr(req: NextRequest): string {
  // We trust the client's timezone offset header if present
  const tz = req.headers.get("x-timezone");
  if (tz) {
    try {
      return new Date().toLocaleDateString("en-CA", { timeZone: tz }); // "YYYY-MM-DD"
    } catch { /* fall through */ }
  }
  return new Date().toISOString().slice(0, 10);
}

/** Monday of the week that contains the given YYYY-MM-DD date */
function weekStart(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=Sun…6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Mon
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export async function POST(req: NextRequest) {
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

  const today = todayStr(req);
  const admin = createAdminClient();

  // ── 1. Insert today's check-in (ignore duplicate) ─────────────────
  await admin
    .from("daily_checkins")
    .upsert({ user_id: user.id, date: today }, { onConflict: "user_id,date" });

  // ── 2. Fetch recent checkins for streak calc (last 400 days max) ──
  const since = new Date(today);
  since.setDate(since.getDate() - 400);

  const { data: rows } = await admin
    .from("daily_checkins")
    .select("date")
    .eq("user_id", user.id)
    .gte("date", since.toISOString().slice(0, 10))
    .order("date", { ascending: false });

  const dates = new Set((rows ?? []).map((r) => r.date as string));

  // ── 3. Calculate streak ────────────────────────────────────────────
  let streak = 0;
  const cursor = new Date(today + "T00:00:00Z");
  while (true) {
    const ds = cursor.toISOString().slice(0, 10);
    if (!dates.has(ds)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (streak > 365) break; // safety cap
  }

  // ── 4. Persist streak on profile ──────────────────────────────────
  await admin
    .from("profiles")
    .update({ streak_count: streak, streak_last_date: today })
    .eq("id", user.id);

  // ── 5. Build this week's boolean array (Mon=0 … Sun=6) ────────────
  const mon = weekStart(today);
  const week: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const ds = mon.toISOString().slice(0, 10);
    week.push(dates.has(ds));
    mon.setUTCDate(mon.getUTCDate() + 1);
  }

  // todayIndex: Mon=0 … Sun=6
  const jsDay = new Date(today + "T00:00:00Z").getUTCDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

  return NextResponse.json({ streak, week, todayIndex } satisfies StreakData);
}
