-- ============================================================
-- Thank You. — Migration 006: Vision Jobs — FAL request ID
--
-- Adds fal_request_id to vision_generation_jobs, and creates
-- the table from scratch if it doesn't exist yet.
--
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================

-- Create table if it was never created from 004_vision_jobs.sql
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

-- Add fal_request_id column (the FAL queue request ID for async status checks)
alter table public.vision_generation_jobs
  add column if not exists fal_request_id text;

-- Indexes
create index if not exists vision_jobs_user_id_idx on public.vision_generation_jobs(user_id);
create index if not exists vision_jobs_status_idx  on public.vision_generation_jobs(status);

-- Enable RLS
alter table public.vision_generation_jobs enable row level security;

-- Policies (drop and recreate so re-runs are safe)
drop policy if exists "vision_jobs_select_own" on public.vision_generation_jobs;
drop policy if exists "vision_jobs_insert_own" on public.vision_generation_jobs;
drop policy if exists "vision_jobs_update_own" on public.vision_generation_jobs;

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

-- Auto-update updated_at (requires public.set_updated_at() from migration 001)
drop trigger if exists on_vision_jobs_updated on public.vision_generation_jobs;
create trigger on_vision_jobs_updated
  before update on public.vision_generation_jobs
  for each row execute function public.set_updated_at();
