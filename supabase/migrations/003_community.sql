-- ============================================================
-- Thank You. — Supabase Migration 003
-- Community: posts, likes, comments
-- Run AFTER 001_initial.sql (requires set_updated_at function).
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- ── community_posts ───────────────────────────────────────────

create table if not exists public.community_posts (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  content    text        not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_user_idx    on public.community_posts(user_id);
create index if not exists community_posts_created_idx on public.community_posts(created_at desc);

alter table public.community_posts enable row level security;

-- Any authenticated user can read all posts
create policy "community_posts_select"
  on public.community_posts for select
  to authenticated
  using (true);

-- Users can create their own posts
create policy "community_posts_insert"
  on public.community_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can delete their own posts
create policy "community_posts_delete"
  on public.community_posts for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists on_community_posts_updated on public.community_posts;
create trigger on_community_posts_updated
  before update on public.community_posts
  for each row execute function public.set_updated_at();

-- ── community_likes ───────────────────────────────────────────

create table if not exists public.community_likes (
  post_id    uuid        not null references public.community_posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_likes enable row level security;

create policy "community_likes_select"
  on public.community_likes for select
  to authenticated
  using (true);

create policy "community_likes_insert"
  on public.community_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "community_likes_delete"
  on public.community_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── community_comments ────────────────────────────────────────

create table if not exists public.community_comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.community_posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  content    text        not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx on public.community_comments(post_id);

alter table public.community_comments enable row level security;

create policy "community_comments_select"
  on public.community_comments for select
  to authenticated
  using (true);

create policy "community_comments_insert"
  on public.community_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "community_comments_delete"
  on public.community_comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── Seed a few starter posts (optional — remove if you prefer empty) ──
-- These use a placeholder user_id and will only work if you have a
-- real user with that ID. Leave commented out and add posts via the UI.
-- ──────────────────────────────────────────────────────────────────────
