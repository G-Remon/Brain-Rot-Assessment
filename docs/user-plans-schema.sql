create table public.user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 18000),
  updated_at timestamptz not null default now()
);
alter table public.user_plans enable row level security;
revoke all on public.user_plans from public, anon, authenticated;
grant select, delete on public.user_plans to authenticated;
grant insert (user_id,state) on public.user_plans to authenticated;
grant update (user_id,state) on public.user_plans to authenticated;
create policy user_plans_select_own on public.user_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy user_plans_insert_own on public.user_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_plans_update_own on public.user_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy user_plans_delete_own on public.user_plans for delete to authenticated using ((select auth.uid()) = user_id);

create function mindreset_private.validate_plan_state()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
declare
  k text;
  v jsonb;
  answers_count integer := 0;
  days_count integer;
  days_distinct integer;
  expected_key text := '';
  prefix text;
  i integer;
begin
  if current_user not in ('postgres','service_role') and new.user_id is distinct from auth.uid() then
    raise exception 'Plan owner mismatch' using errcode='42501';
  end if;
  if (select count(*) from jsonb_object_keys(new.state)) <> 7
     or not (new.state ?& array['version','answers','assessment_key','config','started_on','completed_days','notes'])
     or new.state->'version' is distinct from '1'::jsonb
     or jsonb_typeof(new.state->'answers') is distinct from 'object'
     or jsonb_typeof(new.state->'config') is distinct from 'object'
     or jsonb_typeof(new.state->'completed_days') is distinct from 'array'
     or jsonb_typeof(new.state->'notes') is distinct from 'object' then
    raise exception 'Invalid plan shape' using errcode='23514';
  end if;
  for k,v in select key,value from jsonb_each(new.state->'answers') loop
    if k !~ '^(f|s|p|m|n|i)[1-5]$' or jsonb_typeof(v) is distinct from 'number' or v::text not in ('0','1','2','3','4') then
      raise exception 'Invalid plan answer' using errcode='23514';
    end if;
    answers_count := answers_count+1;
  end loop;
  if answers_count <> 30 then raise exception 'Incomplete plan assessment' using errcode='23514'; end if;
  foreach prefix in array array['f','s','p','m','n','i'] loop
    for i in 1..5 loop expected_key := expected_key || (new.state->'answers'->>(prefix||i::text)); end loop;
  end loop;
  if jsonb_typeof(new.state->'assessment_key') is distinct from 'string' or new.state->>'assessment_key' is distinct from expected_key then
    raise exception 'Plan snapshot mismatch' using errcode='23514';
  end if;
  if (select count(*) from jsonb_object_keys(new.state->'config')) <> 3
     or not (new.state->'config' ?& array['track','minutes','context'])
     or jsonb_typeof(new.state->'config'->'track') is distinct from 'string'
     or new.state->'config'->>'track' not in ('auto','focus','scroll','patience','learning','sleep','impact','sleep-focus','study','gentle','maintain')
     or new.state->'config'->'minutes' not in ('10'::jsonb,'20'::jsonb,'30'::jsonb)
     or jsonb_typeof(new.state->'config'->'context') is distinct from 'string'
     or new.state->'config'->>'context' not in ('study','work','general') then
    raise exception 'Invalid plan configuration' using errcode='23514';
  end if;
  if jsonb_typeof(new.state->'started_on') is distinct from 'string' or new.state->>'started_on' !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Invalid plan date' using errcode='23514';
  end if;
  perform (new.state->>'started_on')::date;
  select count(*),count(distinct value) into days_count,days_distinct from jsonb_array_elements(new.state->'completed_days');
  if days_count>14 or days_count<>days_distinct then raise exception 'Invalid completed days' using errcode='23514'; end if;
  for v in select value from jsonb_array_elements(new.state->'completed_days') loop
    if jsonb_typeof(v) is distinct from 'number' or v::text !~ '^([1-9]|1[0-4])$' then
      raise exception 'Invalid completed day' using errcode='23514';
    end if;
  end loop;
  for k,v in select key,value from jsonb_each(new.state->'notes') loop
    if k !~ '^([1-9]|1[0-4])$' or jsonb_typeof(v) is distinct from 'string' or char_length(v #>> '{}')>500 then
      raise exception 'Invalid day note' using errcode='23514';
    end if;
  end loop;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function mindreset_private.validate_plan_state() from public, anon, authenticated;
create trigger validate_user_plan_before_write before insert or update on public.user_plans for each row execute function mindreset_private.validate_plan_state();
comment on table public.user_plans is 'One private active 14-day plan per user; validated answer snapshot, configuration, completion and optional notes. Client scores never grant access.';
