-- ============================================================
-- Thank You. — Migration 005: Community Upgrade
-- Adds threaded replies (parent_comment_id) and a new
-- community_reactions table (thumbs_up / heart) for both
-- posts and comments.
-- Safe to run multiple times. Does NOT destroy existing data.
-- ============================================================

-- ── 1. Threaded replies: add parent_comment_id ─────────────────────────

alter table public.community_comments
  add column if not exists parent_comment_id uuid
    references public.community_comments(id) on delete cascade;

create index if not exists community_comments_parent_idx
  on public.community_comments(parent_comment_id)
  where parent_comment_id is not null;

-- ── 2. community_reactions ─────────────────────────────────────────────
--    Replaces community_likes for fine-grained thumbs_up / heart reactions.
--    Supports both post reactions and comment reactions.

create table if not exists public.community_reactions (
  id            uuid        primary key default gen_random_uuid(),
  post_id       uuid        references public.community_posts(id)    on delete cascade,
  comment_id    uuid        references public.community_comments(id) on delete cascade,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  reaction_type text        not null check (reaction_type in ('thumbs_up', 'heart')),
  created_at    timestamptz not null default now(),

  -- Must belong to exactly one target (post OR comment, never both / neither)
  constraint reaction_target_check check (
    (post_id is not null)::int + (comment_id is not null)::int = 1
  )
);

-- Partial unique indexes (NULLs are not equal, so table-level unique won't work)
create unique index if not exists reaction_post_unique_idx
  on public.community_reactions(post_id, user_id, reaction_type)
  where post_id is not null;

create unique index if not exists reaction_comment_unique_idx
  on public.community_reactions(comment_id, user_id, reaction_type)
  where comment_id is not null;

create index if not exists community_reactions_post_idx
  on public.community_reactions(post_id) where post_id is not null;

create index if not exists community_reactions_comment_idx
  on public.community_reactions(comment_id) where comment_id is not null;

create index if not exists community_reactions_user_idx
  on public.community_reactions(user_id);

alter table public.community_reactions enable row level security;

create policy "community_reactions_select"
  on public.community_reactions for select
  to authenticated using (true);

create policy "community_reactions_insert"
  on public.community_reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "community_reactions_delete"
  on public.community_reactions for delete
  to authenticated
  using (auth.uid() = user_id);
