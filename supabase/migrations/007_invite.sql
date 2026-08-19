-- ============================================================
-- Thank You. — Migration 007: Invite & Referral System
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================

-- ── 1. Add invite_code + country_code to profiles ─────────────────────

alter table public.profiles
  add column if not exists invite_code  text unique,
  add column if not exists country_code text;   -- ISO 3166-1 alpha-2, e.g. "US"

-- Function to generate a unique 8-char invite code
create or replace function public.generate_invite_code()
returns text language plpgsql as $$
declare
  chars   text    := 'abcdefghjkmnpqrstuvwxyz23456789'; -- no ambiguous chars
  code    text    := '';
  attempt integer := 0;
  i       integer;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where invite_code = code);
    attempt := attempt + 1;
    if attempt > 200 then
      raise exception 'generate_invite_code: could not find unique code after 200 tries';
    end if;
  end loop;
  return code;
end;
$$;

-- Back-fill invite codes for any existing profiles that don't have one
do $$
declare
  r record;
begin
  for r in select id from public.profiles where invite_code is null loop
    update public.profiles
       set invite_code = public.generate_invite_code()
     where id = r.id;
  end loop;
end;
$$;

-- Make sure every new profile gets a code on insert
create or replace function public.assign_invite_code()
returns trigger language plpgsql as $$
begin
  if new.invite_code is null then
    new.invite_code := public.generate_invite_code();
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_assign_invite_code on public.profiles;
create trigger on_profile_assign_invite_code
  before insert on public.profiles
  for each row execute function public.assign_invite_code();

-- ── 2. referrals table ────────────────────────────────────────────────

create table if not exists public.referrals (
  id               uuid        primary key default gen_random_uuid(),
  inviter_user_id  uuid        not null references auth.users(id) on delete cascade,
  invited_user_id  uuid        not null unique references auth.users(id) on delete cascade,
                                -- UNIQUE: each new user can only be attributed to ONE inviter
  invite_code      text        not null,
  created_at       timestamptz not null default now()
);

create index if not exists referrals_inviter_idx on public.referrals(inviter_user_id);
create index if not exists referrals_code_idx    on public.referrals(invite_code);

alter table public.referrals enable row level security;

-- Inviters can see referrals they created; invited users can see their own row
drop policy if exists "referrals_select" on public.referrals;
create policy "referrals_select"
  on public.referrals for select
  to authenticated
  using (auth.uid() = inviter_user_id or auth.uid() = invited_user_id);

-- Only the service role (server-side) inserts referrals — no client insert policy

-- ── 3. Helper: get_network_stats(user_id) ────────────────────────────
-- Returns direct invite count + total network (all descendants, up to depth 5
-- to prevent infinite recursion on circular data).

create or replace function public.get_network_stats(p_user_id uuid)
returns table (
  direct_invites  bigint,
  total_network   bigint,
  max_depth       integer
)
language sql stable security definer as $$
  with recursive tree as (
    -- Level 1: direct invitees
    select inviter_user_id, invited_user_id, 1 as depth
      from public.referrals
     where inviter_user_id = p_user_id
    union all
    -- Deeper levels (cap at 10 to prevent runaway)
    select r.inviter_user_id, r.invited_user_id, t.depth + 1
      from public.referrals r
      join tree t on r.inviter_user_id = t.invited_user_id
     where t.depth < 10
  )
  select
    (select count(*) from public.referrals where inviter_user_id = p_user_id)::bigint as direct_invites,
    (select count(*) from tree)::bigint as total_network,
    coalesce((select max(depth) from tree), 0)::integer as max_depth
$$;

grant execute on function public.get_network_stats(uuid) to authenticated;

-- ── 4. Helper: get_network_countries(user_id) ────────────────────────
-- Returns country_code + count for everyone in the user's network tree.

create or replace function public.get_network_countries(p_user_id uuid)
returns table (
  country_code text,
  member_count bigint
)
language sql stable security definer as $$
  with recursive tree as (
    select invited_user_id, 1 as depth
      from public.referrals
     where inviter_user_id = p_user_id
    union all
    select r.invited_user_id, t.depth + 1
      from public.referrals r
      join tree t on r.inviter_user_id = t.invited_user_id
     where t.depth < 10
  )
  select p.country_code, count(*)::bigint as member_count
    from tree
    join public.profiles p on p.id = tree.invited_user_id
   where p.country_code is not null
   group by p.country_code
   order by member_count desc
$$;

grant execute on function public.get_network_countries(uuid) to authenticated;
