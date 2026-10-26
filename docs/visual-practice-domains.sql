-- Extend existing owner-only practice metadata; no permission or policy changes.
alter table public.practice_attempts drop constraint practice_attempts_domain_check;
alter table public.practice_attempts add constraint practice_attempts_domain_check check(domain in('focus','scroll','patience','memory','sleep','impact','math','cards','visual'));
