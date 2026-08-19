-- ============================================================
-- Thank You. — Migration 011: Rename Confessions → Affirmations
-- Safe for production: renames existing tables/columns if present,
-- otherwise creates fresh affirmation tables.
-- ============================================================

-- ── 1. Rename legacy tables (if 010 was already applied) ─────

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_confessions'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_affirmations'
  ) then
    alter table public.user_confessions rename to user_affirmations;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_affirmations' and column_name = 'confession_text'
  ) then
    alter table public.user_affirmations rename column confession_text to affirmation_text;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'confession_completions'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'affirmation_completions'
  ) then
    alter table public.confession_completions rename to affirmation_completions;
  end if;
end $$;

-- ── 2. Create tables if neither legacy nor new exist ─────────

create table if not exists public.user_affirmations (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users(id) on delete cascade,
  affirmation_text     text        not null,
  scripture_reference  text        not null default '',
  sort_order           integer     not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists user_affirmations_user_order_idx
  on public.user_affirmations(user_id, sort_order);

create table if not exists public.affirmation_completions (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  completion_date date        not null,
  created_at      timestamptz not null default now(),
  unique (user_id, completion_date)
);

create index if not exists affirmation_completions_user_date_idx
  on public.affirmation_completions(user_id, completion_date desc);

-- ── 3. RLS (drop legacy policy names, create affirmation policies) ─

alter table public.user_affirmations enable row level security;
alter table public.affirmation_completions enable row level security;

drop policy if exists "user_confessions_select_own" on public.user_affirmations;
drop policy if exists "user_confessions_insert_own" on public.user_affirmations;
drop policy if exists "user_confessions_update_own" on public.user_affirmations;
drop policy if exists "user_confessions_delete_own" on public.user_affirmations;
drop policy if exists "confession_completions_select_own" on public.affirmation_completions;
drop policy if exists "confession_completions_insert_own" on public.affirmation_completions;

drop policy if exists "user_affirmations_select_own" on public.user_affirmations;
create policy "user_affirmations_select_own"
  on public.user_affirmations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_affirmations_insert_own" on public.user_affirmations;
create policy "user_affirmations_insert_own"
  on public.user_affirmations for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_affirmations_update_own" on public.user_affirmations;
create policy "user_affirmations_update_own"
  on public.user_affirmations for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_affirmations_delete_own" on public.user_affirmations;
create policy "user_affirmations_delete_own"
  on public.user_affirmations for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "affirmation_completions_select_own" on public.affirmation_completions;
create policy "affirmation_completions_select_own"
  on public.affirmation_completions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "affirmation_completions_insert_own" on public.affirmation_completions;
create policy "affirmation_completions_insert_own"
  on public.affirmation_completions for insert to authenticated
  with check (auth.uid() = user_id);

-- ── 4. updated_at trigger ────────────────────────────────────

drop trigger if exists on_user_confessions_updated on public.user_affirmations;
drop trigger if exists on_user_affirmations_updated on public.user_affirmations;
create trigger on_user_affirmations_updated
  before update on public.user_affirmations
  for each row execute function public.set_updated_at();
