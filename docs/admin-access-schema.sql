-- Admin identities are provisioned privately after verifying the owner's account.
-- No real account IDs or emails are stored in this public source file.
create table mindreset_access.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table mindreset_access.admin_users enable row level security;
revoke all on mindreset_access.admin_users from public,anon,authenticated;
create policy admin_users_no_client_access on mindreset_access.admin_users as restrictive for all to anon,authenticated using (false) with check (false);
create function mindreset_access.is_admin() returns boolean language sql stable security definer set search_path=pg_catalog as $$
 select (select auth.uid()) is not null and exists(select 1 from mindreset_access.admin_users where user_id=(select auth.uid()));
$$;
revoke all on function mindreset_access.is_admin() from public,anon;
grant execute on function mindreset_access.is_admin() to authenticated;
create function public.is_site_admin() returns boolean language sql stable security invoker set search_path=pg_catalog as $$select mindreset_access.is_admin();$$;
revoke all on function public.is_site_admin() from public,anon;
grant execute on function public.is_site_admin() to authenticated;
create or replace function public.has_active_pro() returns boolean language sql stable security invoker set search_path=pg_catalog as $$
 select mindreset_access.is_admin() or exists(select 1 from public.entitlements where user_id=(select auth.uid()) and tier='pro' and valid_until>now());
$$;
create function public.get_my_access_context() returns jsonb language sql stable security invoker set search_path=pg_catalog as $$
 select jsonb_build_object('is_admin',mindreset_access.is_admin(),'active',public.has_active_pro(),'paid_until',(select valid_until from public.entitlements where user_id=(select auth.uid()) and tier='pro' and valid_until>now()));
$$;
revoke all on function public.get_my_access_context() from public,anon;
grant execute on function public.get_my_access_context() to authenticated;

create or replace function mindreset_access.admin_overview(search_query text default '',page_number integer default 1) returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare
 q text:=left(trim(coalesce(search_query,'')),100);
 page integer:=greatest(1,least(coalesce(page_number,1),10000));
 results jsonb;
 matched integer;
begin
 if auth.uid() is null or not mindreset_access.is_admin() then raise exception 'Admin access required' using errcode='42501';end if;
 select count(*) into matched from auth.users u left join public.profiles p on p.id=u.id
 where q='' or coalesce(u.email,'') ilike '%'||q||'%' or coalesce(p.display_name,u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','') ilike '%'||q||'%';
 select coalesce(jsonb_agg(row_data order by created_at desc),'[]'::jsonb) into results from (
  select u.created_at,jsonb_build_object(
   'id',u.id,'email',u.email,'name',left(coalesce(nullif(p.display_name,''),u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','مستخدم'),80),
   'createdAt',u.created_at,'lastSignInAt',u.last_sign_in_at,'verified',u.email_confirmed_at is not null,
   'provider',left(coalesce(u.raw_app_meta_data->>'provider','unknown'),30),
   'role',case when a.user_id is not null then 'admin' else 'member' end,
   'subscription',case when a.user_id is not null then 'admin_access' when e.tier='pro' and e.valid_until>now() then 'active' when e.tier='pro' then 'expired' else 'free' end,
   'validUntil',e.valid_until,
   'assessmentCount',(select count(*) from public.assessments r where r.user_id=u.id)
  ) as row_data
  from auth.users u left join public.profiles p on p.id=u.id left join public.entitlements e on e.user_id=u.id left join mindreset_access.admin_users a on a.user_id=u.id
  where q='' or coalesce(u.email,'') ilike '%'||q||'%' or coalesce(p.display_name,u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','') ilike '%'||q||'%'
  order by u.created_at desc,u.id desc limit 20 offset ((page-1)*20)
 ) rows;
 return jsonb_build_object(
  'summary',jsonb_build_object('users',(select count(*) from auth.users),'verifiedUsers',(select count(*) from auth.users where email_confirmed_at is not null),'newThisWeek',(select count(*) from auth.users where created_at>=now()-interval '7 days'),'activeSubscriptions',(select count(*) from public.entitlements where tier='pro' and valid_until>now()),'admins',(select count(*) from mindreset_access.admin_users),'savedAssessments',(select count(*) from public.assessments)),
  'users',results,'total',matched,'page',page,'pageSize',20,
  'payments',jsonb_build_object('connected',false,'records','[]'::jsonb,'totalReceived',null,'currency','EGP','message','تحصيل Paymob لم يتم ربطه بعد. صلاحية Pro أو الأدمن لا تعتبر إثبات دفع.'),
  'generatedAt',now()
 );
end;$$;
revoke all on function mindreset_access.admin_overview(text,integer) from public,anon;
grant execute on function mindreset_access.admin_overview(text,integer) to authenticated;
create function public.get_admin_overview(search_query text default '',page_number integer default 1) returns jsonb language sql stable security invoker set search_path=pg_catalog as $$select mindreset_access.admin_overview(search_query,page_number);$$;
revoke all on function public.get_admin_overview(text,integer) from public,anon;
grant execute on function public.get_admin_overview(text,integer) to authenticated;
