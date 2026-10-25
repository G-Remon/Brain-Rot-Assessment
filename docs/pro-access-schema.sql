create function public.has_active_pro() returns boolean language sql stable security invoker set search_path=pg_catalog as $$
 select exists(select 1 from public.entitlements where user_id=(select auth.uid()) and tier='pro' and valid_until>now());
$$;
revoke all on function public.has_active_pro() from public,anon;
grant execute on function public.has_active_pro() to authenticated;

create schema mindreset_access;
revoke all on schema mindreset_access from public,anon;
grant usage on schema mindreset_access to authenticated;
-- This narrowly scoped SECURITY DEFINER is necessary to avoid recursive RLS
-- when determining the most recent assessment. It never accepts a user ID.
create function mindreset_access.latest_own_assessment() returns uuid language sql stable security definer set search_path=pg_catalog as $$
 select id from public.assessments where user_id=(select auth.uid()) and (select auth.uid()) is not null order by created_at desc,id desc limit 1;
$$;
revoke all on function mindreset_access.latest_own_assessment() from public,anon;
grant execute on function mindreset_access.latest_own_assessment() to authenticated;
alter policy assessments_select_own on public.assessments using ((select auth.uid())=user_id and ((select public.has_active_pro()) or id=(select mindreset_access.latest_own_assessment())));

alter policy user_plans_select_own on public.user_plans using ((select auth.uid())=user_id and (select public.has_active_pro()));
alter policy user_plans_insert_own on public.user_plans with check ((select auth.uid())=user_id and (select public.has_active_pro()));
alter policy user_plans_update_own on public.user_plans using ((select auth.uid())=user_id and (select public.has_active_pro())) with check ((select auth.uid())=user_id and (select public.has_active_pro()));

create table public.pro_workspace (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null check(jsonb_typeof(state)='object' and octet_length(state::text)<=524288),
 updated_at timestamptz not null default now(),
 constraint pro_state_version check (state->'version'='1'::jsonb),
 constraint pro_state_arrays check (
 jsonb_typeof(state->'goals')='array' and jsonb_array_length(state->'goals')<=5 and
 jsonb_typeof(state->'sessions')='array' and jsonb_array_length(state->'sessions')<=200 and
 jsonb_typeof(state->'distractions')='array' and jsonb_array_length(state->'distractions')<=200 and
 jsonb_typeof(state->'sleep')='array' and jsonb_array_length(state->'sleep')<=120 and
 jsonb_typeof(state->'cards')='array' and jsonb_array_length(state->'cards')<=100 and
 jsonb_typeof(state->'reviews')='array' and jsonb_array_length(state->'reviews')<=26 and
 jsonb_typeof(state->'challenges')='array' and jsonb_array_length(state->'challenges')<=10 and
 jsonb_typeof(state->'experiments')='array' and jsonb_array_length(state->'experiments')<=10)
);
alter table public.pro_workspace enable row level security;
revoke all on public.pro_workspace from public,anon,authenticated;
grant select,delete on public.pro_workspace to authenticated;
grant insert(user_id,state) on public.pro_workspace to authenticated;
grant update(user_id,state) on public.pro_workspace to authenticated;
create policy pro_workspace_read on public.pro_workspace for select to authenticated using ((select auth.uid())=user_id and (select public.has_active_pro()));
create policy pro_workspace_insert on public.pro_workspace for insert to authenticated with check ((select auth.uid())=user_id and (select public.has_active_pro()));
create policy pro_workspace_update on public.pro_workspace for update to authenticated using ((select auth.uid())=user_id and (select public.has_active_pro())) with check ((select auth.uid())=user_id and (select public.has_active_pro()));
create policy pro_workspace_delete on public.pro_workspace for delete to authenticated using ((select auth.uid())=user_id);
create function mindreset_private.validate_pro_workspace() returns trigger language plpgsql security invoker set search_path=pg_catalog as $$
declare field text; expected text[]:=array['version','goals','sessions','distractions','sleep','cards','reviews','challenges','experiments','program'];
begin
 if (select count(*) from jsonb_object_keys(new.state))<>10 or not(new.state ?& expected) then raise exception 'Invalid workspace shape' using errcode='23514';end if;
 if new.state->'version' is distinct from '1'::jsonb then raise exception 'Invalid workspace version' using errcode='23514';end if;
 foreach field in array array['goals','sessions','distractions','sleep','cards','reviews','challenges','experiments'] loop
  if jsonb_typeof(new.state->field) is distinct from 'array' then raise exception 'Invalid workspace collection' using errcode='23514';end if;
 end loop;
 if new.state->'program' is distinct from 'null'::jsonb and jsonb_typeof(new.state->'program') is distinct from 'object' then raise exception 'Invalid program' using errcode='23514';end if;
 new.updated_at:=now();return new;
end;$$;
revoke all on function mindreset_private.validate_pro_workspace() from public,anon,authenticated;
create trigger validate_pro_workspace before insert or update on public.pro_workspace for each row execute function mindreset_private.validate_pro_workspace();

create function mindreset_access.erase_own_pro_data() returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
 if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
 delete from public.pro_workspace where user_id=auth.uid();
 delete from public.user_plans where user_id=auth.uid();
end;$$;
revoke all on function mindreset_access.erase_own_pro_data() from public,anon;
grant execute on function mindreset_access.erase_own_pro_data() to authenticated;
create function public.delete_my_pro_data() returns void language sql security invoker set search_path=pg_catalog as $$select mindreset_access.erase_own_pro_data();$$;
revoke all on function public.delete_my_pro_data() from public,anon;
grant execute on function public.delete_my_pro_data() to authenticated;

-- Free users can still erase all of their own history, including rows hidden by
-- newest-only reads. This narrow definer is never given an owner argument.
create function mindreset_access.erase_own_assessments() returns integer language plpgsql security definer set search_path=pg_catalog as $$
declare deleted integer;
begin
 if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
 delete from public.assessments where user_id=auth.uid();get diagnostics deleted=row_count;return deleted;
end;$$;
revoke all on function mindreset_access.erase_own_assessments() from public,anon;
grant execute on function mindreset_access.erase_own_assessments() to authenticated;
create function public.delete_my_assessment_history() returns integer language sql security invoker set search_path=pg_catalog as $$select mindreset_access.erase_own_assessments();$$;
revoke all on function public.delete_my_assessment_history() from public,anon;
grant execute on function public.delete_my_assessment_history() to authenticated;
