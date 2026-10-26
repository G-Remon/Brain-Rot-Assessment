-- Training results are self-reported practice metadata, not clinical scores or certified examinations.
create table public.practice_attempts(
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 domain text not null check(domain in('focus','scroll','patience','memory','sleep','impact','math','cards','visual')),
 level smallint not null check(level between 1 and 3),
 correct smallint not null check(correct between 0 and 4),
 total smallint not null default 4 check(total=4),
 bank_version smallint not null default 1 check(bank_version=1),
 completed_at timestamptz not null default now()
);
create index practice_attempts_user_time on public.practice_attempts(user_id,completed_at desc);
alter table public.practice_attempts enable row level security;
revoke all on public.practice_attempts from public,anon,authenticated;
grant select on public.practice_attempts to authenticated;
grant insert(id,user_id,domain,level,correct,total,bank_version) on public.practice_attempts to authenticated;
create policy practice_read_own on public.practice_attempts for select to authenticated using((select auth.uid())=user_id);
create policy practice_insert_own on public.practice_attempts for insert to authenticated with check((select auth.uid())=user_id);
-- Best result for every domain/level is independent of how many later attempts exist.
create function public.get_my_practice_progress() returns jsonb language sql stable security invoker set search_path=pg_catalog as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'domain',domain,'level',level,'correct',correct,'total',total,'completedAt',completed_at) order by completed_at desc,id),'[]'::jsonb)
 from(select distinct on(domain,level) id,domain,level,correct,total,completed_at from public.practice_attempts where user_id=(select auth.uid()) and bank_version=1 order by domain,level,correct desc,completed_at desc,id) best;
$$;
revoke all on function public.get_my_practice_progress() from public,anon;
grant execute on function public.get_my_practice_progress() to authenticated;
