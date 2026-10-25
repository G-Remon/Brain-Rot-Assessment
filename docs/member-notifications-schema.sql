-- Personal reminders and aggregate analytics. Existing admin roles and VAPID keys are preserved.
create table mindreset_access.notification_preferences(user_id uuid primary key references auth.users on delete cascade,enabled boolean not null default false,hour integer not null default 20 check(hour between 0 and 23),timezone text not null default 'Africa/Cairo',sound boolean not null default true,admin_hourly boolean not null default true,admin_daily boolean not null default true,updated_at timestamptz not null default now());
create table mindreset_access.member_devices(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,endpoint text unique not null check(length(endpoint)<=2048),subscription jsonb not null check(octet_length(subscription::text)<4096),created_at timestamptz not null default now());
create index member_devices_owner on mindreset_access.member_devices(user_id);
create table mindreset_access.notification_jobs(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,source text not null,payload jsonb not null,created_at timestamptz not null default now(),processed_at timestamptz,lease_until timestamptz,attempts integer not null default 0,unique(user_id,source));
create index notification_jobs_pending on mindreset_access.notification_jobs(created_at) where processed_at is null;
create table mindreset_access.notification_receipts(event_id uuid references mindreset_access.notification_jobs on delete cascade,device_id uuid references mindreset_access.member_devices on delete cascade,accepted_at timestamptz not null default now(),primary key(event_id,device_id));
create index notification_receipts_device on mindreset_access.notification_receipts(device_id);
create table mindreset_access.usage_events(id uuid primary key,user_id uuid references auth.users on delete set null,session_id uuid not null,kind text not null,route text not null,created_at timestamptz not null default now());
create index usage_events_time on mindreset_access.usage_events(created_at);
create index usage_events_owner_time on mindreset_access.usage_events(user_id,created_at);
create table mindreset_access.analytics_start(singleton boolean primary key default true check(singleton),started_at timestamptz not null default now());
insert into mindreset_access.analytics_start default values;
create table mindreset_access.site_updates(id uuid primary key,body text not null check(length(body) between 1 and 240),created_by uuid references auth.users on delete set null,created_at timestamptz not null default now());
do $$declare t text;begin foreach t in array array['notification_preferences','member_devices','notification_jobs','notification_receipts','usage_events','analytics_start','site_updates'] loop
 execute format('alter table mindreset_access.%I enable row level security',t);execute format('revoke all on mindreset_access.%I from public,anon,authenticated',t);execute format('create policy deny_clients on mindreset_access.%I as restrictive for all to anon,authenticated using(false) with check(false)',t);end loop;end;$$;
create function mindreset_access.as_array(v jsonb) returns jsonb language sql immutable set search_path=pg_catalog as $$select case when jsonb_typeof(v)='array' then v else '[]'::jsonb end$$;
create function mindreset_access.as_date(value text) returns date language plpgsql immutable set search_path=pg_catalog as $$begin if value !~ '^\d{4}-\d{2}-\d{2}$' then return null;end if;return value::date;exception when others then return null;end;$$;
create function mindreset_access.first_name(owner_id uuid) returns text language sql stable security definer set search_path=pg_catalog as $$select left(split_part(trim(regexp_replace(coalesce(nullif(p.display_name,''),u.raw_user_meta_data->>'full_name','صديقي'),'[[:cntrl:][:space:]]+',' ','g')),' ',1),30) from auth.users u left join public.profiles p on p.id=u.id where u.id=owner_id$$;
create function mindreset_access.next_steps(owner_id uuid,day text) returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare plan jsonb;work jsonb;items jsonb:='[]';n integer;done integer;g jsonb;t jsonb;d integer;
begin
 select state into plan from public.user_plans where user_id=owner_id;select state into work from public.pro_workspace where user_id=owner_id;
 if plan is not null and plan->>'started_on'<=day then
  select count(distinct x) into done from jsonb_array_elements(mindreset_access.as_array(plan->'completed_days')) x where x in(select to_jsonb(i) from generate_series(1,14)i);
  -- Days become due one by one; valid plan dates are enforced by the existing plan trigger.
  d:=least(14,greatest(0,(day::date-mindreset_access.as_date(plan->>'started_on'))+1));
  select min(i) into n from generate_series(1,d)i where not mindreset_access.as_array(plan->'completed_days') @> jsonb_build_array(i);
  if n is not null then items:=items||jsonb_build_array(jsonb_build_object('label',case when done>=11 then 'فاضل '||(14-done)||' أيام وتكمّل خطتك' else 'خطوة اليوم '||n||' من خطتك مستنياك' end,'url','/#/journey','kind','plan'));end if;
 end if;
 for g in select value from jsonb_array_elements(mindreset_access.as_array(work->'goals')) loop
  if mindreset_access.as_array(g->'weekdays') @> jsonb_build_array(extract(dow from day::date)::integer) then
   for t in select value from jsonb_array_elements(mindreset_access.as_array(g->'tasks')) where value->>'doneOn' is null loop
    items:=items||jsonb_build_array(jsonb_build_object('label','خطوة من هدفك: '||left(coalesce(t->>'title','كمّل أول مهمة'),100),'url','/#/tools?panel=goals','kind','goal'));end loop;
  end if;
 end loop;
 select count(*) into n from jsonb_array_elements(mindreset_access.as_array(work->'cards')) where value->>'due' ~ '^\d{4}-\d{2}-\d{2}$' and value->>'due'<=day;
 if n>0 then items:=items||jsonb_build_array(jsonb_build_object('label',n||' كروت جاهزة للمراجعة','url','/#/tools?panel=learning','kind','recall'));end if;
 if jsonb_typeof(work->'program')='object' and work->'program'->>'startedOn'<=day and work->'program'->>'days' in('30','60','90') then
  select count(distinct x) into n from jsonb_array_elements(mindreset_access.as_array(work->'program'->'completed')) x where jsonb_typeof(x)='number';
  if n<(work->'program'->>'days')::integer and not mindreset_access.as_array(work->'program'->'completed') @> jsonb_build_array(least((work->'program'->>'days')::integer,greatest(1,day::date-mindreset_access.as_date(work->'program'->>'startedOn')+1))) then items:=items||jsonb_build_array(jsonb_build_object('label','كمّل خطوتك في البرنامج الطويل','url','/#/tools?panel=program','kind','program'));end if;
 end if;
 if work is not null and extract(dow from day::date)=5 and not exists(select 1 from jsonb_array_elements(mindreset_access.as_array(work->'reviews')) where value->>'date'>=(day::date-6)::text) then items:=items||jsonb_build_array(jsonb_build_object('label','راجع أسبوعك واختار خطوة للأسبوع الجاي','url','/#/tools?panel=review','kind','review'));end if;
 for g in select value from jsonb_array_elements(mindreset_access.as_array(work->'challenges')) where value->>'startedOn'<=day loop
  if jsonb_array_length(mindreset_access.as_array(g->'completed'))<7 and not mindreset_access.as_array(g->'completed') @> jsonb_build_array(least(7,greatest(1,day::date-mindreset_access.as_date(g->>'startedOn')+1))) then items:=items||jsonb_build_array(jsonb_build_object('label','كمّل تحدّيك: '||left(coalesce(g->>'title','خطوة صغيرة'),80),'url','/#/tools?panel=habits','kind','challenge'));end if;
 end loop;
 for g in select value from jsonb_array_elements(mindreset_access.as_array(work->'experiments')) where value->>'after' is null loop
  items:=items||jsonb_build_array(jsonb_build_object('label','لما تخلص تجربتك، سجّل النتيجة: '||left(coalesce(g->>'title','تجربتك'),80),'url','/#/tools?panel=habits','kind','experiment'));
 end loop;
 return items;
end;$$;
create function mindreset_access.notification_enqueue(owner_id uuid,source_key text,message jsonb) returns void language sql security definer set search_path=pg_catalog as $$insert into mindreset_access.notification_jobs(user_id,source,payload) select owner_id,source_key,message where exists(select 1 from mindreset_access.notification_preferences p join mindreset_access.member_devices d on d.user_id=p.user_id where p.user_id=owner_id and p.enabled) on conflict(user_id,source) do nothing$$;
create function mindreset_access.member_service(operation text,payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare owner_id uuid;result jsonb;target uuid;pref mindreset_access.notification_preferences;zone text;h integer;
begin
 if operation in('config','subscribe','unsubscribe','preferences','test_target','focus') then
  owner_id:=(member_service.payload->>'owner')::uuid;if not exists(select 1 from auth.users where id=owner_id) then raise exception 'Unknown user';end if;
  insert into mindreset_access.notification_preferences(user_id) values(owner_id) on conflict do nothing;
  if operation='subscribe' then
   if (select count(*) from mindreset_access.member_devices where user_id=owner_id)>=5 and not exists(select 1 from mindreset_access.member_devices where endpoint=member_service.payload->'subscription'->>'endpoint' and user_id=owner_id) then raise exception 'Device limit';end if;
   insert into mindreset_access.member_devices(user_id,endpoint,subscription) values(owner_id,member_service.payload->'subscription'->>'endpoint',member_service.payload->'subscription') on conflict(endpoint) do update set user_id=excluded.user_id,subscription=excluded.subscription,created_at=now();
   update mindreset_access.notification_preferences set enabled=true,updated_at=now() where user_id=owner_id;
  elsif operation='unsubscribe' then delete from mindreset_access.member_devices where user_id=owner_id and endpoint=member_service.payload->>'endpoint';
  elsif operation='preferences' then
   zone:=member_service.payload->>'timezone';h:=(member_service.payload->>'hour')::integer;
   if h is null or h not between 0 and 23 or not exists(select 1 from pg_timezone_names where name=zone) then raise exception 'Invalid reminder time';end if;
   update mindreset_access.notification_preferences set hour=h,timezone=zone,sound=coalesce((member_service.payload->>'sound')::boolean,true),enabled=coalesce((member_service.payload->>'enabled')::boolean,false),admin_hourly=coalesce((member_service.payload->>'adminHourly')::boolean,true),admin_daily=coalesce((member_service.payload->>'adminDaily')::boolean,true),updated_at=now() where user_id=owner_id;
  elsif operation='test_target' then select jsonb_build_object('id',id,'subscription',subscription,'name',mindreset_access.first_name(owner_id)) into result from mindreset_access.member_devices where user_id=owner_id and endpoint=member_service.payload->>'endpoint';return result;
  elsif operation='focus' then
   -- One replaceable server timer per user; pause/reset cancels an unsent reminder.
   delete from mindreset_access.notification_jobs where user_id=owner_id and source='focus';
   if (member_service.payload->>'seconds')::integer between 1 and 1800 then
    perform mindreset_access.notification_enqueue(owner_id,'focus-'||(member_service.payload->>'id'),jsonb_build_object('body','يا '||mindreset_access.first_name(owner_id)||'، جلسة التركيز خلصت. سجّل ناتجك وخُد راحة.','url','/#/tools?panel=focus'));
    update mindreset_access.notification_jobs set created_at=now()+make_interval(secs=>(member_service.payload->>'seconds')::integer),source='focus' where user_id=owner_id and source='focus-'||(member_service.payload->>'id');
   end if;return '{}';
  end if;
  select * into pref from mindreset_access.notification_preferences where user_id=owner_id;
  return jsonb_build_object('name',mindreset_access.first_name(owner_id),'preferences',to_jsonb(pref)-'user_id','steps',mindreset_access.next_steps(owner_id,to_char(now() at time zone pref.timezone,'YYYY-MM-DD')),'isAdmin',exists(select 1 from mindreset_access.admin_users where user_id=owner_id),'registered',exists(select 1 from mindreset_access.member_devices where user_id=owner_id and endpoint=member_service.payload->>'endpoint'));
 end if;
 if operation='claim' then
  update mindreset_access.notification_jobs j set processed_at=now() from mindreset_access.notification_preferences p where j.user_id=p.user_id and j.source like 'daily-%' and j.processed_at is null and jsonb_array_length(mindreset_access.next_steps(j.user_id,to_char(now() at time zone p.timezone,'YYYY-MM-DD')))=0;
  with chosen as(select j.id from mindreset_access.notification_jobs j join mindreset_access.notification_preferences p on p.user_id=j.user_id and p.enabled where j.processed_at is null and j.created_at<=now() and j.created_at>now()-interval '24 hours' and j.attempts<8 and coalesce(j.lease_until,'-infinity'::timestamptz)<now() order by j.created_at for update of j skip locked limit 20),claimed as(update mindreset_access.notification_jobs set attempts=attempts+1,lease_until=now()+interval '2 minutes' where id in(select id from chosen) returning *) select coalesce(jsonb_agg(jsonb_build_object('id',id,'payload',claimed.payload,'source',claimed.source,'owner',claimed.user_id)),'[]') into result from claimed;return result;
 elsif operation='targets' then
  select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'subscription',d.subscription)),'[]') into result from mindreset_access.member_devices d join mindreset_access.notification_jobs j on j.user_id=d.user_id and j.id=(member_service.payload->>'event')::uuid join mindreset_access.notification_preferences p on p.user_id=d.user_id and p.enabled where d.created_at<=j.created_at and not exists(select 1 from mindreset_access.notification_receipts r where r.event_id=j.id and r.device_id=d.id);return result;
 elsif operation='delivered' then insert into mindreset_access.notification_receipts(event_id,device_id) values((member_service.payload->>'event')::uuid,(member_service.payload->>'subscription')::uuid) on conflict do nothing;
 elsif operation='expired' then delete from mindreset_access.member_devices where id=(member_service.payload->>'subscription')::uuid;
 elsif operation='complete' then update mindreset_access.notification_jobs set processed_at=now(),lease_until=null where id=(member_service.payload->>'event')::uuid;
 elsif operation='retry' then update mindreset_access.notification_jobs set lease_until=now()+interval '2 minutes' where id=(member_service.payload->>'event')::uuid;
 else raise exception 'Unknown operation';end if;return '{}';
end;$$;
create function public.member_push_service(operation text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path=pg_catalog as $$select mindreset_access.member_service(operation,payload)$$;
-- Authenticated event ingestion is deliberately bounded and never accepts another owner ID.
create function mindreset_access.track_usage(event_id uuid,visit_id uuid,event_kind text,page text) returns void language plpgsql security definer set search_path=pg_catalog as $$begin
 if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
 if event_kind not in('page_view','test_started','test_completed','notification_open') or page not in('home','quiz','results','account','library','journey','tools','science','admin') then raise exception 'Invalid event';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,7));
 if (select count(*) from mindreset_access.usage_events where user_id=auth.uid() and created_at>now()-interval '1 minute')>=40 then return;end if;
 insert into mindreset_access.usage_events(id,user_id,session_id,kind,route) values(event_id,auth.uid(),visit_id,event_kind,page) on conflict do nothing;
end;$$;
create function public.track_usage(event_id uuid,visit_id uuid,event_kind text,page text) returns void language sql security invoker set search_path=pg_catalog as $$select mindreset_access.track_usage(event_id,visit_id,event_kind,page)$$;
create function mindreset_access.analytics(days integer) returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare since timestamptz;result jsonb;
begin
 if auth.uid() is null or not mindreset_access.is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 since:=now()-make_interval(days=>case when days=7 then 7 else 30 end);
 select jsonb_build_object('startedAt',(select started_at from mindreset_access.analytics_start),'generatedAt',now(),
 'views',(select count(*) from mindreset_access.usage_events where created_at>=since and kind='page_view'),
 'sessions',(select count(distinct session_id) from mindreset_access.usage_events where created_at>=since),
 'activeUsers',(select count(distinct user_id) from mindreset_access.usage_events where created_at>=since),
 'activeNow',(select count(distinct user_id) from mindreset_access.usage_events where created_at>now()-interval '5 minutes'),
 'signups',(select count(*) from auth.users where created_at>=since),
 'testStarts',(select count(*) from mindreset_access.usage_events where created_at>=since and kind='test_started'),
 'testCompletions',(select count(*) from mindreset_access.assessment_completions where created_at>=since),
 'planUsers',(select count(*) from public.user_plans),
 'completedPlans',(select count(*) from public.user_plans where jsonb_array_length(mindreset_access.as_array(state->'completed_days'))=14),
 'daily',(select coalesce(jsonb_agg(x),'[]') from(select to_char(d,'YYYY-MM-DD') as "day",count(e.id) filter(where kind='page_view') views,count(distinct e.user_id) users from generate_series(date_trunc('day',since),date_trunc('day',now()),interval '1 day')d left join mindreset_access.usage_events e on e.created_at>=d and e.created_at<d+interval '1 day' group by d order by d)x),
 'hourly',(select coalesce(jsonb_agg(x),'[]') from(select to_char(d,'HH24:00') as "hour",count(e.id) filter(where kind='page_view') views from generate_series(date_trunc('hour',now())-interval '23 hours',date_trunc('hour',now()),interval '1 hour')d left join mindreset_access.usage_events e on e.created_at>=d and e.created_at<d+interval '1 hour' group by d order by d)x),
 'pages',(select coalesce(jsonb_agg(x),'[]') from(select route,count(*) views from mindreset_access.usage_events where created_at>=since and kind='page_view' group by route order by count(*) desc)x),
 'funnel',(select jsonb_build_object('started',count(*),'completed',count(*) filter(where completed)) from(select s.session_id,bool_or(c.id is not null) completed from mindreset_access.usage_events s left join mindreset_access.usage_events c on c.session_id=s.session_id and c.user_id=s.user_id and c.kind='test_completed' and c.created_at>=s.created_at where s.created_at>=since and s.kind='test_started' group by s.session_id)f),
 'push',jsonb_build_object('devices',(select count(*) from mindreset_access.member_devices),'accepted',(select count(*) from mindreset_access.notification_receipts where accepted_at>=since),'pending',(select count(*) from mindreset_access.notification_jobs where processed_at is null and attempts<8 and created_at>now()-interval '24 hours'),'failed',(select count(*) from mindreset_access.notification_jobs where processed_at is null and attempts>=8)),
 'tasks',(select count(*) from public.pro_workspace w cross join lateral jsonb_array_elements(mindreset_access.as_array(w.state->'goals'))g cross join lateral jsonb_array_elements(mindreset_access.as_array(g->'tasks'))t where t->>'doneOn' is not null)
 ) into result;return result;
end;$$;
create function public.get_site_analytics(days integer default 7) returns jsonb language sql stable security invoker set search_path=pg_catalog as $$select mindreset_access.analytics(days)$$;
create function mindreset_access.publish_update(update_id uuid,message text) returns integer language plpgsql security definer set search_path=pg_catalog as $$declare n integer;begin
 if auth.uid() is null or not mindreset_access.is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 if length(trim(message)) not between 1 and 240 then raise exception 'Invalid message';end if;
 insert into mindreset_access.site_updates(id,body,created_by) values(update_id,trim(message),auth.uid()) on conflict do nothing;
 get diagnostics n=row_count;if n=0 then return 0;end if;
 insert into mindreset_access.notification_jobs(user_id,source,payload) select p.user_id,'update-'||update_id,jsonb_build_object('body','يا '||mindreset_access.first_name(p.user_id)||'، '||trim(message),'url','/#/home') from mindreset_access.notification_preferences p where p.enabled and exists(select 1 from mindreset_access.member_devices d where d.user_id=p.user_id) on conflict do nothing;
 get diagnostics n=row_count;return n;
end;$$;
create function public.publish_site_update(update_id uuid,message text) returns integer language sql security invoker set search_path=pg_catalog as $$select mindreset_access.publish_update(update_id,message)$$;
-- Restrict every helper explicitly; browser access is through narrow invoker wrappers.
revoke all on function mindreset_access.as_date(text),mindreset_access.as_array(jsonb),mindreset_access.first_name(uuid),mindreset_access.next_steps(uuid,text),mindreset_access.notification_enqueue(uuid,text,jsonb),mindreset_access.member_service(text,jsonb) from public,anon,authenticated;
revoke all on function public.member_push_service(text,jsonb) from public,anon,authenticated;
grant execute on function mindreset_access.member_service(text,jsonb),public.member_push_service(text,jsonb) to service_role;
revoke all on function mindreset_access.track_usage(uuid,uuid,text,text),public.track_usage(uuid,uuid,text,text),mindreset_access.analytics(integer),public.get_site_analytics(integer),mindreset_access.publish_update(uuid,text),public.publish_site_update(uuid,text) from public,anon;
grant execute on function mindreset_access.track_usage(uuid,uuid,text,text),public.track_usage(uuid,uuid,text,text),mindreset_access.analytics(integer),public.get_site_analytics(integer),mindreset_access.publish_update(uuid,text),public.publish_site_update(uuid,text) to authenticated;
create function mindreset_access.notification_tick() returns void language plpgsql security definer set search_path=pg_catalog as $$
declare owner_pref record;local_now timestamp;steps jsonb;summary text;n bigint;s bigint;c bigint;period_start timestamptz;
begin
 -- Keep work bounded to consenting accounts with a live device.
 for owner_pref in select x.* from mindreset_access.notification_preferences x where x.enabled and exists(select 1 from mindreset_access.member_devices d where d.user_id=x.user_id) loop
  local_now:=now() at time zone owner_pref.timezone;
  if extract(hour from local_now)=owner_pref.hour then
   steps:=mindreset_access.next_steps(owner_pref.user_id,to_char(local_now,'YYYY-MM-DD'));
   if jsonb_array_length(steps)>0 then
    summary:='يا '||mindreset_access.first_name(owner_pref.user_id)||'، '||(steps->0->>'label')||case when jsonb_array_length(steps)>1 then '. وعندك '||(jsonb_array_length(steps)-1)||' خطوات كمان في «خطوتك الجاية».' else '. خطوة صغيرة كفاية النهارده.' end;
    perform mindreset_access.notification_enqueue(owner_pref.user_id,'daily-'||to_char(local_now,'YYYY-MM-DD'),jsonb_build_object('body',summary,'url',steps->0->>'url'));
   end if;
  end if;
  if exists(select 1 from mindreset_access.admin_users where user_id=owner_pref.user_id) then
   if owner_pref.admin_hourly and extract(hour from local_now) between 9 and 22 then
    period_start:=date_trunc('hour',now())-interval '1 hour';
    select count(distinct user_id) into n from mindreset_access.usage_events where created_at>=period_start and created_at<date_trunc('hour',now());
    select count(*) filter(where kind='signup'),count(*) filter(where kind='assessment_completed') into s,c from mindreset_access.admin_events where created_at>=period_start and created_at<date_trunc('hour',now());
    if n+s+c>0 then perform mindreset_access.notification_enqueue(owner_pref.user_id,'hourly-'||date_trunc('hour',now())::text,jsonb_build_object('body','يا '||mindreset_access.first_name(owner_pref.user_id)||'، الساعة اللي فاتت: '||n||' مستخدم نشط، '||s||' تسجيل جديد، '||c||' اختبار مكتمل.','url','/#/admin'));end if;
   end if;
   if owner_pref.admin_daily and extract(hour from local_now)=22 then
    select count(distinct user_id) into n from mindreset_access.usage_events where created_at>=now()-interval '24 hours';
    select count(*) filter(where kind='signup'),count(*) filter(where kind='assessment_completed') into s,c from mindreset_access.admin_events where created_at>=now()-interval '24 hours';
    if n+s+c>0 then perform mindreset_access.notification_enqueue(owner_pref.user_id,'summary-'||to_char(local_now,'YYYY-MM-DD'),jsonb_build_object('body','يا '||mindreset_access.first_name(owner_pref.user_id)||'، ملخص آخر 24 ساعة: '||n||' مستخدم نشط، '||s||' حساب جديد، '||c||' اختبار مكتمل.','url','/#/admin'));end if;
   end if;
  end if;
 end loop;
 if exists(select 1 from mindreset_access.notification_jobs j join mindreset_access.notification_preferences setting on setting.user_id=j.user_id and setting.enabled where j.processed_at is null and j.attempts<8 and j.created_at<=now() and j.created_at>now()-interval '24 hours' and coalesce(j.lease_until,'-infinity'::timestamptz)<now()) then
  perform net.http_post(url:='https://acofddiawbhbwhcgekrk.supabase.co/functions/v1/admin-notifications',headers:=jsonb_build_object('Content-Type','application/json','x-mindreset-push-secret',(select webhook_secret from mindreset_access.push_settings where singleton)),body:='{"action":"member-dispatch"}'::jsonb,timeout_milliseconds:=90000);
 end if;
 delete from mindreset_access.usage_events where created_at<now()-interval '90 days';
 delete from mindreset_access.notification_jobs where created_at<now()-interval '30 days';
end;$$;
revoke all on function mindreset_access.notification_tick() from public,anon,authenticated;
select cron.schedule('mindreset-personal-reminders','* * * * *','select mindreset_access.notification_tick()');
