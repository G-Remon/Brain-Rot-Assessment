-- Apply after pro-access-schema.sql and admin-access-schema.sql.
-- Product is now entirely free; legacy object names preserve existing user data.
create or replace function public.has_active_pro() returns boolean language sql stable security invoker set search_path=pg_catalog as $$ select (select auth.uid()) is not null; $$;
create or replace function public.get_my_access_context() returns jsonb language sql stable security invoker set search_path=pg_catalog as $$
 select jsonb_build_object('is_admin',mindreset_access.is_admin(),'active',(select auth.uid()) is not null,'paid_until',null);
$$;
alter policy assessments_select_own on public.assessments using ((select auth.uid())=user_id);
alter policy user_plans_select_own on public.user_plans using ((select auth.uid())=user_id);
alter policy user_plans_insert_own on public.user_plans with check ((select auth.uid())=user_id);
alter policy user_plans_update_own on public.user_plans using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
alter policy pro_workspace_read on public.pro_workspace using ((select auth.uid())=user_id);
alter policy pro_workspace_insert on public.pro_workspace with check ((select auth.uid())=user_id);
alter policy pro_workspace_update on public.pro_workspace using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create or replace function mindreset_access.admin_overview(search_query text default '',page_number integer default 1) returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare q text:=left(trim(coalesce(search_query,'')),100); page integer:=greatest(1,least(coalesce(page_number,1),10000)); results jsonb; matched integer;
begin
 if auth.uid() is null or not mindreset_access.is_admin() then raise exception 'Admin access required' using errcode='42501';end if;
 select count(*) into matched from auth.users u left join public.profiles p on p.id=u.id
 where q='' or coalesce(u.email,'') ilike '%'||q||'%' or coalesce(p.display_name,u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','') ilike '%'||q||'%';
 select coalesce(jsonb_agg(row_data order by created_at desc,id desc),'[]'::jsonb) into results from (
 select u.id,u.created_at,jsonb_build_object('id',u.id,'email',u.email,'name',left(coalesce(nullif(p.display_name,''),u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','مستخدم'),80),'createdAt',u.created_at,'lastSignInAt',u.last_sign_in_at,'verified',u.email_confirmed_at is not null,'provider',left(coalesce(u.raw_app_meta_data->>'provider','unknown'),30),'role',case when a.user_id is not null then 'admin' else 'member' end,'assessmentCount',(select count(*) from public.assessments r where r.user_id=u.id)) as row_data
 from auth.users u left join public.profiles p on p.id=u.id left join mindreset_access.admin_users a on a.user_id=u.id
 where q='' or coalesce(u.email,'') ilike '%'||q||'%' or coalesce(p.display_name,u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','') ilike '%'||q||'%'
 order by u.created_at desc,u.id desc limit 20 offset ((page-1)*20)) rows;
 return jsonb_build_object('summary',jsonb_build_object('users',(select count(*) from auth.users),'verifiedUsers',(select count(*) from auth.users where email_confirmed_at is not null),'newThisWeek',(select count(*) from auth.users where created_at>=now()-interval '7 days'),'admins',(select count(*) from mindreset_access.admin_users),'savedAssessments',(select count(*) from public.assessments)),'users',results,'total',matched,'page',page,'pageSize',20,'generatedAt',now());
end;$$;
