-- ============================================================
-- Thank You. — Supabase Migration 002
-- Vision Board Images
-- Run this in the Supabase SQL Editor after 001_initial.sql
-- ============================================================

-- ── vision_board_images ───────────────────────────────────────

create table if not exists public.vision_board_images (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  image_url    text        not null,
  storage_path text,
  prompt       text,
  source       text        not null default 'generated' check (source in ('generated', 'uploaded')),
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.vision_board_images is
  'User vision board images — both AI-generated and manually uploaded.';

-- Indexes
create index if not exists vision_board_images_user_id_idx
  on public.vision_board_images(user_id);

create index if not exists vision_board_images_user_order_idx
  on public.vision_board_images(user_id, sort_order, created_at desc);

-- ── Row Level Security ────────────────────────────────────────

alter table public.vision_board_images enable row level security;

create policy "vision_images_select_own"
  on public.vision_board_images for select
  using (auth.uid() = user_id);

create policy "vision_images_insert_own"
  on public.vision_board_images for insert
  with check (auth.uid() = user_id);

create policy "vision_images_update_own"
  on public.vision_board_images for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "vision_images_delete_own"
  on public.vision_board_images for delete
  using (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────────
-- Reuses set_updated_at() from 001_initial.sql

create trigger on_vision_board_images_updated
  before update on public.vision_board_images
  for each row
  execute function public.set_updated_at();

-- ── Storage: vision-board bucket ─────────────────────────────
-- Images are stored as: {user_id}/generated/{uuid}.png
--                       {user_id}/uploads/{uuid}.jpg

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vision-board',
  'vision-board',
  true,
  10485760,  -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Publicly readable (images are shown to the authenticated user)
create policy "vision_board_public_read"
  on storage.objects for select
  using (bucket_id = 'vision-board');

-- Users may only upload into their own folder
create policy "vision_board_user_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vision-board'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vision_board_user_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vision-board'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vision_board_user_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vision-board'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Notes ─────────────────────────────────────────────────────
-- The server API route (app/api/vision/generate/route.ts) uses
-- the Supabase service-role key (SUPABASE_SERVICE_ROLE_KEY) to
-- upload images to Storage on behalf of the authenticated user.
-- The DB insert uses the user's own session for RLS protection.
-- ─────────────────────────────────────────────────────────────
