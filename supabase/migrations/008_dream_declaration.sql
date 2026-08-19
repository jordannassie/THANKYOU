-- ============================================================
-- Thank You. — Migration 008: Dream Declaration
-- Adds a dream_declaration column to the profiles table so
-- declarations persist in the database, not just localStorage.
-- ============================================================

alter table public.profiles
  add column if not exists dream_declaration text;
