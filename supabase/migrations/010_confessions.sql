-- ============================================================
-- Thank You. — Migration 010: Daily Confessions
-- ============================================================

-- Personalized confessions (empty = use built-in defaults in app)
create table if not exists public.user_confessions (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users(id) on delete cascade,
  confession_text      text        not null,
  scripture_reference  text        not null default '',
  sort_order           integer     not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists user_confessions_user_order_idx
  on public.user_confessions(user_id, sort_order);

-- Daily completion — one row per user per calendar day
create table if not exists public.confession_completions (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  completion_date date        not null,
  created_at      timestamptz not null default now(),
  unique (user_id, completion_date)
);

create index if not exists confession_completions_user_date_idx
  on public.confession_completions(user_id, completion_date desc);

-- ── RLS ──────────────────────────────────────────────────────

alter table public.user_confessions enable row level security;
alter table public.confession_completions enable row level security;

drop policy if exists "user_confessions_select_own" on public.user_confessions;
create policy "user_confessions_select_own"
  on public.user_confessions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_confessions_insert_own" on public.user_confessions;
create policy "user_confessions_insert_own"
  on public.user_confessions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_confessions_update_own" on public.user_confessions;
create policy "user_confessions_update_own"
  on public.user_confessions for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_confessions_delete_own" on public.user_confessions;
create policy "user_confessions_delete_own"
  on public.user_confessions for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "confession_completions_select_own" on public.confession_completions;
create policy "confession_completions_select_own"
  on public.confession_completions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "confession_completions_insert_own" on public.confession_completions;
create policy "confession_completions_insert_own"
  on public.confession_completions for insert to authenticated
  with check (auth.uid() = user_id);

-- ── updated_at trigger ───────────────────────────────────────

drop trigger if exists on_user_confessions_updated on public.user_confessions;
create trigger on_user_confessions_updated
  before update on public.user_confessions
  for each row execute function public.set_updated_at();
