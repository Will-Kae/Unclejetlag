-- Disposable CI only. Audit failure must roll back submission and review.
begin;
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000011'),
 ('00000000-0000-4000-8000-000000000012');
insert into public.passport_research_profiles(user_id,role,active) values
 ('00000000-0000-4000-8000-000000000011','researcher',true),
 ('00000000-0000-4000-8000-000000000012','reviewer',true);

create or replace function pg_temp.reject_test_audit() returns trigger
language plpgsql as $$
begin
  raise exception 'TEST_AUDIT_FAILURE';
end $$;

do $$
declare
  v_actor uuid := '00000000-0000-4000-8000-000000000011';
  v_reviewer uuid := '00000000-0000-4000-8000-000000000012';
  v_id uuid;
  v_before integer;
begin
  select count(*) into v_before from public.passport_evidence_submissions
    where submitter_id = v_actor;
  create temporary table audit_test_marker(flag boolean);
  execute 'create trigger reject_audit before insert on public.passport_verification_audit for each row execute function pg_temp.reject_test_audit()';
  begin
    perform passport_internal.submit_evidence(
      v_actor,'rollback-rule','AUS','ZAF','visa_free','official-source',
      'https://example.gov/visas',now(),
      'This submission must be rolled back with the failed audit insert.',false
    );
    raise exception 'Submission succeeded despite audit failure';
  exception when others then
    if sqlerrm <> 'TEST_AUDIT_FAILURE' then raise; end if;
  end;
  if (select count(*) from public.passport_evidence_submissions
      where submitter_id=v_actor) <> v_before then
    raise exception 'Submission survived failed audit';
  end if;
  execute 'drop trigger reject_audit on public.passport_verification_audit';

  v_id := passport_internal.submit_evidence(
    v_actor,'rollback-review-rule','AUS','ZAF','visa_free','official-source',
    'https://example.gov/visas',now(),
    'This submission exists for a failed review audit rollback test.',false
  );
  execute 'create trigger reject_audit before insert on public.passport_verification_audit for each row execute function pg_temp.reject_test_audit()';
  begin
    perform passport_internal.review_evidence(
      v_reviewer,v_id,1,'approve',
      'This approval must be rolled back if the audit insert fails.'
    );
    raise exception 'Review succeeded despite audit failure';
  exception when others then
    if sqlerrm <> 'TEST_AUDIT_FAILURE' then raise; end if;
  end;
  if (select status from public.passport_evidence_submissions where id=v_id) <> 'submitted'
    or exists(select 1 from public.passport_verification_reviews where submission_id=v_id) then
    raise exception 'Review or status survived failed audit';
  end if;
  execute 'drop trigger reject_audit on public.passport_verification_audit';
  raise notice 'PASS audit failure rolls back submission and review';
end $$;
rollback;
