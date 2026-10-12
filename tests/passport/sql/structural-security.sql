-- Run ONLY on a disposable development database after applying staged migrations.
-- Read-only structural assertions. Transaction behavior needs separate fixtures.
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'passport_internal'
    and p.proname in ('submit_evidence','review_evidence','resubmit_evidence')
    and p.prosecdef = false;
  if v_count <> 3 then raise exception 'Expected three SECURITY INVOKER internal functions; got %', v_count; end if;

  select count(*) into v_count from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('passport_server_submit','passport_server_review',
                      'passport_server_resubmit','passport_server_rate_limit')
    and p.prosecdef = false
    and not has_function_privilege('anon',p.oid,'EXECUTE')
    and not has_function_privilege('authenticated',p.oid,'EXECUTE')
    and has_function_privilege('service_role',p.oid,'EXECUTE');
  if v_count <> 4 then raise exception 'Server-only RPC permission check failed (%/4)',v_count; end if;

  if has_schema_privilege('anon','passport_internal','USAGE')
     or has_schema_privilege('authenticated','passport_internal','USAGE')
  then raise exception 'Private schema exposed to client roles'; end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.passport_verification_reviews'::regclass
      and conname = 'passport_reviews_one_per_reviewer_revision'
  ) then raise exception 'Revision uniqueness constraint missing'; end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.passport_evidence_submissions'::regclass
      and tgname = 'passport_submission_transition_guard'
      and not tgisinternal
  ) then raise exception 'Submission transition trigger missing'; end if;

  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='passport_write_rate_buckets'
      and c.relrowsecurity
  ) then raise exception 'Rate bucket RLS missing'; end if;
  raise notice 'PASS passport structural security assertions';
end $$;
