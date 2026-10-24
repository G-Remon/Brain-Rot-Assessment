-- MindReset: least-privilege schema, own-row RLS, and payment-ready entitlements.
-- Applied ONLY to Supabase project acofddiawbhbwhcgekrk.
-- IMPORTANT: The public Vite publishable key is not a database secret.
-- Never store private or payment credentials in public tables or frontend code.

-- A preinstalled event trigger uses this SECURITY DEFINER function to enable
-- RLS for new tables. It must NOT be callable through /rest/v1/rpc by visitors.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null check (
    jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 8192
  ),
  total_score smallint not null check (total_score between 0 and 120),
  created_at timestamptz not null default now()
);
comment on column public.assessments.total_score is
  'Client-provided display score only. Never trust for billing or access control.';
create index assessments_user_created_idx
  on public.assessments (user_id, created_at desc);

-- A missing row means Free. PRO access must be checked on the trusted server
-- including valid_until. No browser client can insert/update/delete its tier.
create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  valid_until timestamptz,
  updated_at timestamptz not null default now(),
  constraint pro_requires_expiration check (tier <> 'pro' or valid_until is not null)
);
comment on table public.entitlements is
  'Server-controlled subscription rights. Never expose mutations to browser clients.';

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.entitlements enable row level security;

revoke all on table public.profiles, public.assessments, public.entitlements
  from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant delete on public.profiles to authenticated;

grant select on public.assessments to authenticated;
grant insert (user_id, answers, total_score) on public.assessments to authenticated;
grant delete on public.assessments to authenticated;

grant select on public.entitlements to authenticated;

create policy profiles_select_own on public.profiles
 for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles
 for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
 for update to authenticated
 using ((select auth.uid()) = id)
 with check ((select auth.uid()) = id);
create policy profiles_delete_own on public.profiles
 for delete to authenticated using ((select auth.uid()) = id);

create policy assessments_select_own on public.assessments
 for select to authenticated using ((select auth.uid()) = user_id);
create policy assessments_insert_own on public.assessments
 for insert to authenticated with check ((select auth.uid()) = user_id);
create policy assessments_delete_own on public.assessments
 for delete to authenticated using ((select auth.uid()) = user_id);

create policy entitlements_select_own on public.entitlements
 for select to authenticated using ((select auth.uid()) = user_id);
