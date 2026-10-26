-- Existing authenticated page-view ingestion recognizes the two new public routes.
create or replace function mindreset_access.track_usage(event_id uuid,visit_id uuid,event_kind text,page text) returns void language plpgsql security definer set search_path=pg_catalog as $$begin
 if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
 if event_kind not in('page_view','test_started','test_completed','notification_open') or page not in('home','guide','articles','practice','quiz','results','account','library','journey','tools','science','admin') then raise exception 'Invalid event';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,7));
 if (select count(*) from mindreset_access.usage_events where user_id=auth.uid() and created_at>now()-interval '1 minute')>=40 then return;end if;
 insert into mindreset_access.usage_events(id,user_id,session_id,kind,route) values(event_id,auth.uid(),visit_id,event_kind,page) on conflict do nothing;
end;$$;