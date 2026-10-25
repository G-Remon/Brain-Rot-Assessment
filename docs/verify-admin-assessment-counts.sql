-- Run as database owner. Synthetic account and notification work roll back.
begin;
do $$
declare member_id uuid:=gen_random_uuid();completion_id uuid:=gen_random_uuid();admin_id uuid;entry jsonb;
begin
 select user_id into admin_id from mindreset_access.admin_users limit 1;
 if admin_id is null then raise exception 'Existing admin required for verification';end if;
 insert into auth.users(id,email,raw_user_meta_data) values(member_id,'count-test-'||member_id||'@example.invalid','{"full_name":"Counter verification"}');
 perform set_config('request.jwt.claim.sub',member_id::text,true);
 perform public.record_assessment_completed(completion_id);perform public.record_assessment_completed(completion_id);
 begin perform public.get_admin_overview('',1);raise exception 'Member accessed overview';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 entry:=public.get_admin_overview('count-test-'||member_id,1)->'users'->0;
 if (entry->>'completedAssessmentCount')::integer is distinct from 1 or (entry->>'assessmentCount')::integer is distinct from 0 then raise exception 'Completed and saved counts are coupled';end if;
 perform set_config('request.jwt.claim.sub',member_id::text,true);
 perform public.record_assessment_completed(gen_random_uuid());
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 entry:=public.get_admin_overview('count-test-'||member_id,1)->'users'->0;
 if (entry->>'completedAssessmentCount')::integer is distinct from 2 or (entry->>'assessmentCount')::integer is distinct from 0 then raise exception 'Second completion missing';end if;
end $$;
select 'PASS: unsaved completion counts as one, retried completion remains one, second completion counts as two, saved count remains zero, member denied; all changes rolled back' as verification;
rollback;
