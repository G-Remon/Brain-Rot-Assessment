-- Native Web Push for the existing verified admin role. No role changes.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
revoke all on net.http_request_queue,net._http_response from public,anon,authenticated;
create table mindreset_access.push_settings(
 singleton boolean primary key default true check(singleton),
 webhook_secret text not null default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),
 vapid_public text,vapid_private text
);
insert into mindreset_access.push_settings(singleton) values(true);
create table mindreset_access.push_subscriptions(
 id uuid primary key default gen_random_uuid(),admin_id uuid not null references mindreset_access.admin_users(user_id) on delete cascade,
 endpoint text not null unique check(length(endpoint)<=2048),subscription jsonb not null check(octet_length(subscription::text)<4096),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index push_subscriptions_admin on mindreset_access.push_subscriptions(admin_id);
create table mindreset_access.admin_events(
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('signup','assessment_completed')),
 user_id uuid references auth.users(id) on delete set null,source_id uuid not null,created_at timestamptz not null default now(),
 processed_at timestamptz,lease_until timestamptz,attempts integer not null default 0,
 unique(kind,user_id,source_id)
);
create index admin_events_pending on mindreset_access.admin_events(created_at) where processed_at is null;
create index admin_events_user on mindreset_access.admin_events(user_id);
create table mindreset_access.push_deliveries(
 event_id uuid not null references mindreset_access.admin_events(id) on delete cascade,
 subscription_id uuid not null references mindreset_access.push_subscriptions(id) on delete cascade,
 delivered_at timestamptz not null default now(),primary key(event_id,subscription_id)
);
create index push_deliveries_subscription on mindreset_access.push_deliveries(subscription_id);
create table mindreset_access.assessment_completions(
 user_id uuid not null references auth.users(id) on delete cascade,id uuid not null,
 created_at timestamptz not null default now(),primary key(user_id,id)
);
-- Private tables are inaccessible to browser clients; all entry points are explicit RPCs.
do $$declare t text;begin foreach t in array array['push_settings','push_subscriptions','admin_events','push_deliveries','assessment_completions'] loop
 execute format('alter table mindreset_access.%I enable row level security',t);
 execute format('revoke all on mindreset_access.%I from public,anon,authenticated',t);
 execute format('create policy deny_clients on mindreset_access.%I as restrictive for all to anon,authenticated using(false) with check(false)',t);
end loop;end;$$;
create function mindreset_access.kick_admin_push() returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
 if exists(select 1 from mindreset_access.admin_events where processed_at is null and attempts<8 and coalesce(lease_until,'-infinity'::timestamptz)<now()) then
 perform net.http_post(url:='https://acofddiawbhbwhcgekrk.supabase.co/functions/v1/admin-notifications',headers:=jsonb_build_object('Content-Type','application/json','x-mindreset-push-secret',(select webhook_secret from mindreset_access.push_settings where singleton)),body:='{"action":"dispatch"}'::jsonb,timeout_milliseconds:=90000);
 end if;
end;$$;
revoke all on function mindreset_access.kick_admin_push() from public,anon,authenticated;
create function mindreset_access.enqueue_admin_event(event_kind text,actor uuid,source uuid) returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
 insert into mindreset_access.admin_events(kind,user_id,source_id,processed_at)
 values(event_kind,actor,source,case when exists(select 1 from mindreset_access.push_subscriptions) then null else now() end)
 on conflict(kind,user_id,source_id) do nothing;
 -- A push transport problem must never block registration or assessment completion.
 begin perform mindreset_access.kick_admin_push();exception when others then null;end;
end;$$;
revoke all on function mindreset_access.enqueue_admin_event(text,uuid,uuid) from public,anon,authenticated;
create function mindreset_access.notify_new_account() returns trigger language plpgsql security definer set search_path=pg_catalog as $$
begin perform mindreset_access.enqueue_admin_event('signup',new.id,new.id);return new;end;$$;
revoke all on function mindreset_access.notify_new_account() from public,anon,authenticated;
create trigger mindreset_new_account_notification after insert on auth.users for each row execute function mindreset_access.notify_new_account();
create function mindreset_access.record_completion(completion_id uuid) returns void language plpgsql security definer set search_path=pg_catalog as $$
declare inserted integer;
begin
 if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
 if completion_id is null then raise exception 'Completion ID required' using errcode='22023';end if;
 insert into mindreset_access.assessment_completions(user_id,id) values(auth.uid(),completion_id) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=1 then perform mindreset_access.enqueue_admin_event('assessment_completed',auth.uid(),completion_id);end if;
end;$$;
revoke all on function mindreset_access.record_completion(uuid) from public,anon;
grant execute on function mindreset_access.record_completion(uuid) to authenticated;
create function public.record_assessment_completed(completion_id uuid) returns void language sql security invoker set search_path=pg_catalog as $$select mindreset_access.record_completion(completion_id);$$;
revoke all on function public.record_assessment_completed(uuid) from public,anon;
grant execute on function public.record_assessment_completed(uuid) to authenticated;

-- The service-role-only RPC never grants browser access to keys or subscriptions.
create function mindreset_access.push_service(operation text,payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare result jsonb; owner_id uuid; target_id uuid;
begin
 if operation='config' then select to_jsonb(s) into result from mindreset_access.push_settings s where singleton;return result;end if;
 if operation='keys' then
  update mindreset_access.push_settings set vapid_public=payload->>'publicKey',vapid_private=payload->>'privateKey' where singleton and vapid_public is null;
  select to_jsonb(s) into result from mindreset_access.push_settings s where singleton;return result;
 end if;
 if operation in ('devices','subscribe','unsubscribe','test_target') then
  owner_id:=(payload->>'owner')::uuid;
  if not exists(select 1 from mindreset_access.admin_users where user_id=owner_id) then raise exception 'Admin required' using errcode='42501';end if;
  if operation='devices' then
   select coalesce(jsonb_agg(jsonb_build_object('id',id,'createdAt',created_at,'updatedAt',updated_at)),'[]') into result from mindreset_access.push_subscriptions where admin_id=owner_id;return result;
  elsif operation='subscribe' then
   -- Keep re-subscription idempotent; endpoints cannot move between accounts.
   if exists(select 1 from mindreset_access.push_subscriptions where endpoint=payload->'subscription'->>'endpoint' and admin_id<>owner_id) then raise exception 'Endpoint belongs to another account' using errcode='42501';end if;
   if (select count(*) from mindreset_access.push_subscriptions where admin_id=owner_id)>=5 and not exists(select 1 from mindreset_access.push_subscriptions where endpoint=payload->'subscription'->>'endpoint' and admin_id=owner_id) then raise exception 'Device limit' using errcode='22023';end if;
   insert into mindreset_access.push_subscriptions(admin_id,endpoint,subscription) values(owner_id,payload->'subscription'->>'endpoint',payload->'subscription')
   on conflict(endpoint) do update set subscription=excluded.subscription,updated_at=now() where mindreset_access.push_subscriptions.admin_id=owner_id returning id into target_id;
   return jsonb_build_object('id',target_id);
  elsif operation='unsubscribe' then delete from mindreset_access.push_subscriptions where admin_id=owner_id and endpoint=payload->>'endpoint';return '{}'::jsonb;
  else select jsonb_build_object('id',id,'subscription',subscription) into result from mindreset_access.push_subscriptions where admin_id=owner_id and endpoint=payload->>'endpoint';return result;
  end if;
 end if;
 if operation='claim' then
  with chosen as(select id from mindreset_access.admin_events where processed_at is null and attempts<8 and coalesce(lease_until,'-infinity'::timestamptz)<now() order by created_at,id for update skip locked limit 10),claimed as(update mindreset_access.admin_events set lease_until=now()+interval '2 minutes',attempts=attempts+1 where id in(select id from chosen) returning *)
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'createdAt',created_at)),'[]') into result from claimed;return result;
 elsif operation='targets' then
  select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'subscription',s.subscription)),'[]') into result from mindreset_access.push_subscriptions s join mindreset_access.admin_users a on a.user_id=s.admin_id join mindreset_access.admin_events e on e.id=(payload->>'event')::uuid
  where s.created_at<=e.created_at and not exists(select 1 from mindreset_access.push_deliveries d where d.event_id=e.id and d.subscription_id=s.id);return result;
 elsif operation='delivered' then
  insert into mindreset_access.push_deliveries(event_id,subscription_id) values((payload->>'event')::uuid,(payload->>'subscription')::uuid) on conflict do nothing;return '{}'::jsonb;
 elsif operation='complete' then update mindreset_access.admin_events set processed_at=now(),lease_until=null where id=(payload->>'event')::uuid;return '{}'::jsonb;
 elsif operation='expired' then delete from mindreset_access.push_subscriptions where id=(payload->>'subscription')::uuid;return '{}'::jsonb;
 elsif operation='retry' then update mindreset_access.admin_events set lease_until=now()+interval '1 minute' where id=(payload->>'event')::uuid;return '{}'::jsonb;
 end if;
 raise exception 'Unknown service operation' using errcode='22023';
end;$$;
revoke all on function mindreset_access.push_service(text,jsonb) from public,anon,authenticated;
grant usage on schema mindreset_access to service_role;
grant execute on function mindreset_access.push_service(text,jsonb) to service_role;
create function public.admin_push_service(operation text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path=pg_catalog as $$select mindreset_access.push_service(operation,payload);$$;
revoke all on function public.admin_push_service(text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_push_service(text,jsonb) to service_role;
create function mindreset_access.admin_activity() returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare result jsonb;
begin
 if auth.uid() is null or not mindreset_access.is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 select coalesce(jsonb_agg(row_data order by created_at desc,id desc),'[]') into result from (
  select e.id,e.created_at,jsonb_build_object('id',e.id,'kind',e.kind,'createdAt',e.created_at,'email',u.email,'name',left(coalesce(p.display_name,u.raw_user_meta_data->>'full_name','مستخدم'),80)) as row_data
  from mindreset_access.admin_events e left join auth.users u on u.id=e.user_id left join public.profiles p on p.id=e.user_id order by e.created_at desc,e.id desc limit 50) items;
 return result;
end;$$;
revoke all on function mindreset_access.admin_activity() from public,anon;
grant execute on function mindreset_access.admin_activity() to authenticated;
create function public.get_admin_activity() returns jsonb language sql stable security invoker set search_path=pg_catalog as $$select mindreset_access.admin_activity();$$;
revoke all on function public.get_admin_activity() from public,anon;
grant execute on function public.get_admin_activity() to authenticated;
select cron.schedule('mindreset-admin-push-retry','* * * * *','select mindreset_access.kick_admin_push()');
