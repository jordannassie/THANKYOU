-- ============================================================
-- Thank You. — Migration 004: Vision Generation Jobs
-- Run in Supabase SQL Editor before deploying the background
-- function. Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

create table if not exists public.vision_generation_jobs (
  id            uuid        primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  prompt        text        not null,
  status        text        not null default 'pending'
                              check (status in ('pending','processing','completed','failed')),
  image_path    text,
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists vision_jobs_user_id_idx  on public.vision_generation_jobs(user_id);
create index if not exists vision_jobs_status_idx   on public.vision_generation_jobs(status);

alter table public.vision_generation_jobs enable row level security;

-- Users can only see and manage their own jobs
create policy "vision_jobs_select_own"
  on public.vision_generation_jobs for select
  using (auth.uid() = user_id);

create policy "vision_jobs_insert_own"
  on public.vision_generation_jobs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "vision_jobs_update_own"
  on public.vision_generation_jobs for update
  using (auth.uid() = user_id);

-- Auto-update updated_at
drop trigger if exists on_vision_jobs_updated on public.vision_generation_jobs;
create trigger on_vision_jobs_updated
  before update on public.vision_generation_jobs
  for each row execute function public.set_updated_at();
