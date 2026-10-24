-- MindReset • phase 1: user profiles, saved assessments and future entitlements.
-- Run in the MindReset project ONLY. Do not run in another STC/iChem database.
-- Data ownership is always enforced with auth.uid(), never client-supplied roles.
-- Deploy after the Supabase connection has been granted access to this project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  total_score smallint not null check (total_score between 0 and 120),
  created_at timestamptz not null default now()
);

create index if not exists assessments_user_created_idx
  on public.assessments (user_id, created_at desc);

-- Entitlements are server-owned: never grant write access to clients, even PRO.
-- No entitlement record means Free. Payment integration comes much later.
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  valid_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.entitlements enable row level security;

revoke all on public.profiles from public, anon;
revoke all on public.assessments from public, anon;
revoke all on public.entitlements from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, delete on public.assessments to authenticated;
grant select on public.entitlements to authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = (select auth.uid()));

create policy "assessments_select_own" on public.assessments
  for select to authenticated using (user_id = (select auth.uid()));
create policy "assessments_insert_own" on public.assessments
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "assessments_delete_own" on public.assessments
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "entitlements_select_own" on public.entitlements
  for select to authenticated using (user_id = (select auth.uid()));

-- Check after deployment:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
-- AND tablename IN ('profiles','assessments','entitlements');
-- No direct client-side INSERT/UPDATE/DELETE on entitlements should succeed.
