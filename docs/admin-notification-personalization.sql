-- Display-only recipient name, no role changes.
create or replace function mindreset_access.push_service(operation text,payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
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
  else select jsonb_build_object('id',id,'subscription',subscription,'name',mindreset_access.first_name(owner_id)) into result from mindreset_access.push_subscriptions where admin_id=owner_id and endpoint=payload->>'endpoint';return result;
  end if;
 end if;
 if operation='claim' then
  with chosen as(select id from mindreset_access.admin_events where processed_at is null and attempts<8 and coalesce(lease_until,'-infinity'::timestamptz)<now() order by created_at,id for update skip locked limit 10),claimed as(update mindreset_access.admin_events set lease_until=now()+interval '2 minutes',attempts=attempts+1 where id in(select id from chosen) returning *)
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'createdAt',created_at)),'[]') into result from claimed;return result;
 elsif operation='targets' then
  select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'subscription',s.subscription,'name',mindreset_access.first_name(s.admin_id))),'[]') into result from mindreset_access.push_subscriptions s join mindreset_access.admin_users a on a.user_id=s.admin_id join mindreset_access.admin_events e on e.id=(payload->>'event')::uuid
  where s.created_at<=e.created_at and not exists(select 1 from mindreset_access.push_deliveries d where d.event_id=e.id and d.subscription_id=s.id);return result;
 elsif operation='delivered' then
  insert into mindreset_access.push_deliveries(event_id,subscription_id) values((payload->>'event')::uuid,(payload->>'subscription')::uuid) on conflict do nothing;return '{}'::jsonb;
 elsif operation='complete' then update mindreset_access.admin_events set processed_at=now(),lease_until=null where id=(payload->>'event')::uuid;return '{}'::jsonb;
 elsif operation='expired' then delete from mindreset_access.push_subscriptions where id=(payload->>'subscription')::uuid;return '{}'::jsonb;
 elsif operation='retry' then update mindreset_access.admin_events set lease_until=now()+interval '1 minute' where id=(payload->>'event')::uuid;return '{}'::jsonb;
 end if;
 raise exception 'Unknown service operation' using errcode='22023';
end;$$;
