-- ============================================================
-- Thank You. — Migration 009: Daily Streak / Check-ins
-- ============================================================

-- ── 1. daily_checkins — one row per user per calendar day ────
create table if not exists public.daily_checkins (
  user_id uuid  not null references auth.users(id) on delete cascade,
  date    date  not null,
  primary key (user_id, date)
);

alter table public.daily_checkins enable row level security;

-- Users can read/insert their own rows only
create policy "checkins_select_own" on public.daily_checkins
  for select to authenticated using (auth.uid() = user_id);

create policy "checkins_insert_own" on public.daily_checkins
  for insert to authenticated with check (auth.uid() = user_id);

create index if not exists checkins_user_date_idx on public.daily_checkins(user_id, date desc);

-- ── 2. Streak columns on profiles ────────────────────────────
alter table public.profiles
  add column if not exists streak_count      integer not null default 0,
  add column if not exists streak_last_date  date;
