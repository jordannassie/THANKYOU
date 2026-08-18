-- ============================================================
-- Thank You. — Supabase Migration 001
-- Run this in the Supabase SQL Editor (thankyou project).
-- Safe to run on an empty project.
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────

create table if not exists public.profiles (
  id                uuid        primary key references auth.users(id) on delete cascade,
  email             text,
  full_name         text,
  avatar_url        text,
  role              text        not null default 'user' check (role in ('user', 'admin')),
  membership_status text        not null default 'free' check (membership_status in ('free', 'premium')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is 'Public user profiles, linked to auth.users.';

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_role_idx  on public.profiles(role);

-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "users_select_own_profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile (name, avatar only; role/membership protected by trigger)
create policy "users_update_own_profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can read ALL profiles
-- (uses a security-definer helper to avoid recursive RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "admins_select_all_profiles"
  on public.profiles
  for select
  using (public.is_admin());

-- ── Protect role/membership from client-side changes ─────────
-- Normal users cannot change their own role or membership_status.
-- Changes must come through the service-role admin API.

create or replace function public.protect_privileged_fields()
returns trigger
language plpgsql
security definer
as $$
begin
  -- If neither privileged field changed, allow freely.
  if new.role = old.role and new.membership_status = old.membership_status then
    return new;
  end if;

  -- If the change comes from the service role (admin API), allow it.
  -- check_option: JWT claims won't be present when using service_role key.
  if current_setting('request.jwt.claims', true) is distinct from '' then
    declare
      _claims json;
    begin
      _claims := current_setting('request.jwt.claims', true)::json;
      if (_claims->>'role')::text = 'service_role' then
        return new;
      end if;
    exception when others then
      -- JSON parse failed — fall through to block.
    end;
  end if;

  -- Block the change.
  raise exception 'Cannot change role or membership_status without admin privileges.'
    using errcode = 'insufficient_privilege';
end;
$$;

create or replace trigger protect_privileged_fields
  before update of role, membership_status on public.profiles
  for each row
  execute function public.protect_privileged_fields();

-- ── Auto-create profile on new user ──────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ── Auto-update updated_at ────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;

create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ── Storage: avatars bucket ───────────────────────────────────
-- Creates the bucket if it does not exist.
-- If "new row violates row-level security policy" errors occur,
-- create the bucket manually in Supabase → Storage → New bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Avatars are publicly readable
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload/replace their own avatar (path: {user_id}/avatar.ext)
create policy "avatars_user_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_user_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_user_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Make yourself the first admin ────────────────────────────
-- After running this migration, run:
--
--   update public.profiles
--   set role = 'admin'
--   where email = 'YOUR_EMAIL_HERE';
--
-- Replace YOUR_EMAIL_HERE with your actual email address.
-- ─────────────────────────────────────────────────────────────
