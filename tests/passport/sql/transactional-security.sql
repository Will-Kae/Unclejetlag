-- Disposable CI database ONLY. Runs as local PostgreSQL superuser.
-- Tests transaction state machine, history, self-review and rate limits.
begin;
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002'),
 ('00000000-0000-4000-8000-000000000003');
insert into public.passport_research_profiles(user_id,role,active) values
 ('00000000-0000-4000-8000-000000000001','researcher',true),
 ('00000000-0000-4000-8000-000000000002','reviewer',true),
 ('00000000-0000-4000-8000-000000000003','reviewer',false);

do $$
declare
  v_submitter uuid := '00000000-0000-4000-8000-000000000001';
  v_reviewer uuid := '00000000-0000-4000-8000-000000000002';
  v_inactive uuid := '00000000-0000-4000-8000-000000000003';
  v_id uuid;
  v_revision integer;
  v_audit integer;
  v_allowed boolean;
begin
  v_id := passport_internal.submit_evidence(
    v_submitter,'rule-1','AUS','ZAF','visa_free','official-source',
    'https://example.gov/visas',now(),
    'Published official visa requirements verified today.',false
  );
  if v_id is null then raise exception 'Submission did not return ID'; end if;
  select count(*) into v_audit from public.passport_verification_audit where object_id=v_id;
  if v_audit <> 1 then raise exception 'Submission audit missing'; end if;

  begin
    perform passport_internal.review_evidence(
      v_submitter,v_id,1,'approve','Attempt to approve my own submitted evidence.'
    );
    raise exception 'Self-review unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Self-review unexpectedly succeeded' then raise; end if;
  end;

  begin
    perform passport_internal.review_evidence(
      v_inactive,v_id,1,'approve','Inactive reviewer should never be accepted.'
    );
    raise exception 'Inactive reviewer unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Inactive reviewer unexpectedly succeeded' then raise; end if;
  end;

  perform passport_internal.review_evidence(
    v_reviewer,v_id,1,'request_changes',
    'Please replace the source with the latest official publication.'
  );
  if (select status from public.passport_evidence_submissions where id=v_id) <> 'changes_requested'
  then raise exception 'Changes request transition failed'; end if;

  v_revision := passport_internal.resubmit_evidence(
    v_submitter,v_id,1,'updated-official-source','https://example.gov/updated',
    now(),'Updated the evidence using the latest government publication.',false
  );
  if v_revision <> 2 then raise exception 'Revision did not increment to 2'; end if;

  begin
    perform passport_internal.resubmit_evidence(
      v_submitter,v_id,1,'stale','https://example.gov/stale',now(),
      'A stale resubmission must never be accepted here.',false
    );
    raise exception 'Stale revision unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Stale revision unexpectedly succeeded' then raise; end if;
  end;

  perform passport_internal.review_evidence(
    v_reviewer,v_id,2,'approve',
    'The revised official source is sufficiently documented.'
  );
  if (select status from public.passport_evidence_submissions where id=v_id) <> 'approved'
  then raise exception 'Approval failed'; end if;
  if (select count(*) from public.passport_verification_reviews where submission_id=v_id) <> 2
  then raise exception 'Historic review not preserved'; end if;
  if (select count(*) from public.passport_verification_audit where object_id=v_id) <> 4
  then raise exception 'Expected four atomic audit events'; end if;

  begin
    update public.passport_evidence_submissions set rationale='tampered' where id=v_id;
    raise exception 'Approved evidence unexpectedly mutable';
  exception when others then
    if sqlerrm = 'Approved evidence unexpectedly mutable' then raise; end if;
  end;

  for i in 1..11 loop
    v_allowed := public.passport_server_rate_limit(v_submitter,'submit');
    if v_allowed is distinct from (i <= 10) then
      raise exception 'Rate limiter wrong at call %',i;
    end if;
  end loop;
  raise notice 'PASS transactional evidence lifecycle and rate limit fixtures';
end $$;
rollback;
