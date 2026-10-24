-- Applied to the dedicated MindReset Supabase project by migration:
-- limit_and_verify_user_assessment_uploads
-- This file documents the exact server-side verification policy.
create schema if not exists mindreset_private;
revoke all on schema mindreset_private from public, anon, authenticated;

create function mindreset_private.validate_assessment_upload()
returns trigger
language plpgsql security invoker
set search_path = pg_catalog
as $$
declare
  answer_key text;
  answer_value jsonb;
  counted integer := 0;
  computed_score integer := 0;
  recent_uploads integer;
begin
  if current_user not in ('postgres','service_role')
    and new.user_id is distinct from auth.uid() then
    raise exception 'Assessment owner does not match the authenticated user' using errcode = '42501';
  end if;
  if jsonb_typeof(new.answers) is distinct from 'object' then
    raise exception 'Assessment payload must contain answers' using errcode = '23514';
  end if;
  for answer_key,answer_value in select key,value from jsonb_each(new.answers) loop
    if answer_key !~ '^(f|s|p|m|n|i)[1-5]$'
       or jsonb_typeof(answer_value) is distinct from 'number'
       or answer_value::text not in ('0','1','2','3','4') then
      raise exception 'Invalid assessment answer' using errcode = '23514';
    end if;
    counted := counted + 1;
    computed_score := computed_score + (answer_value::text)::integer;
  end loop;
  if counted <> 30 then
    raise exception 'Assessment must have exactly 30 answers' using errcode = '23514';
  end if;
  new.total_score := computed_score;
  perform pg_advisory_xact_lock(hashtextextended('mindreset-assessment:' || new.user_id::text,0));
  select count(*) into recent_uploads from public.assessments
    where user_id=new.user_id and created_at>=now()-interval '24 hours';
  if recent_uploads >= 20 then
    raise exception 'Daily assessment save limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function mindreset_private.validate_assessment_upload() from public, anon, authenticated;
create trigger mindreset_validate_assessment_before_insert
before insert on public.assessments
for each row execute function mindreset_private.validate_assessment_upload();
comment on function mindreset_private.validate_assessment_upload() is
  'Runs as invoking role. Restricts authenticated accounts to 20 saved assessments per rolling day, validates all 30 answers and derives the display-only score.';
