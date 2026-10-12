-- STAGED ONLY. Server-only transactional submission and review.
-- All actor UUIDs must come from a verified Supabase Auth user session in Next.js.
-- Never expose service_role credentials or these operations to browser clients.
begin;
create schema if not exists passport_internal;
revoke all on schema passport_internal from public, anon, authenticated;
grant usage on schema passport_internal to service_role;

create or replace function passport_internal.submit_evidence(
  p_actor uuid, p_rule_id text, p_passport_code text,
  p_destination_code text, p_access text, p_source_id text,
  p_source_url text, p_observed_at timestamptz,
  p_rationale text, p_ai_assisted boolean
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare v_id uuid;
begin
  if p_actor is null or not exists (
    select 1 from public.passport_research_profiles
    where user_id = p_actor and active and role in ('researcher','admin')
  ) then raise exception 'Unauthorized researcher'; end if;
  if p_rule_id is null or length(pg_catalog.btrim(p_rule_id)) = 0
    or p_passport_code is null or p_passport_code !~ '^[A-Z]{3}$'
    or p_destination_code is null or p_destination_code !~ '^[A-Z]{3}$'
    or p_access is null or length(pg_catalog.btrim(p_access)) = 0
    or p_source_id is null or length(pg_catalog.btrim(p_source_id)) = 0
    or p_source_url is null or p_source_url !~ '^https://[^[:space:]]+$'
    or p_observed_at is null or p_ai_assisted is null
    or length(pg_catalog.btrim(coalesce(p_rationale,''))) < 20
  then raise exception 'Invalid evidence'; end if;
  insert into public.passport_evidence_submissions
    (rule_id,passport_code,destination_code,proposed_access,source_id,
     source_url,observed_at,rationale,ai_assisted,submitter_id,status)
  values
    (p_rule_id,p_passport_code,p_destination_code,p_access,p_source_id,
     p_source_url,p_observed_at,p_rationale,p_ai_assisted,p_actor,'submitted')
  returning id into v_id;
  insert into public.passport_verification_audit
    (actor_id,action,object_type,object_id,payload)
  values (p_actor,'evidence_submitted','evidence_submission',v_id,
          pg_catalog.jsonb_build_object('revision',1));
  return v_id;
end;
$$;

create or replace function passport_internal.review_evidence(
  p_actor uuid, p_submission_id uuid, p_revision integer,
  p_decision public.passport_review_decision, p_rationale text
) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_submitter uuid;
  v_revision integer;
  v_status public.passport_submission_status;
begin
  if p_actor is null or p_submission_id is null or p_revision is null
     or p_decision is null
     or p_decision not in ('approve','reject','request_changes')
     or length(pg_catalog.btrim(coalesce(p_rationale,''))) < 20
  then raise exception 'Invalid review'; end if;
  select submitter_id,revision,status
    into v_submitter,v_revision,v_status
  from public.passport_evidence_submissions
  where id = p_submission_id for update;
  if not found or v_status <> 'submitted' or v_revision <> p_revision
  then raise exception 'Unavailable or stale submission'; end if;
  if p_actor = v_submitter then raise exception 'Self-review prohibited'; end if;
  if not exists (
    select 1 from public.passport_research_profiles
    where user_id = p_actor and active and role in ('reviewer','admin')
  ) then raise exception 'Unauthorized reviewer'; end if;

  insert into public.passport_verification_reviews
    (submission_id,reviewer_id,reviewed_revision,decision,rationale)
  values (p_submission_id,p_actor,p_revision,p_decision,p_rationale);

  update public.passport_evidence_submissions
  set status = case p_decision
    when 'approve' then 'approved'::public.passport_submission_status
    when 'reject' then 'rejected'::public.passport_submission_status
    when 'request_changes' then 'changes_requested'::public.passport_submission_status
  end, updated_at = now()
  where id = p_submission_id;

  insert into public.passport_verification_audit
    (actor_id,action,object_type,object_id,payload)
  values (p_actor,'evidence_reviewed','evidence_submission',p_submission_id,
    pg_catalog.jsonb_build_object('decision',p_decision,'revision',p_revision));
end;
$$;

revoke all on function passport_internal.submit_evidence(
  uuid,text,text,text,text,text,text,timestamptz,text,boolean)
  from public,anon,authenticated;
revoke all on function passport_internal.review_evidence(
  uuid,uuid,integer,public.passport_review_decision,text)
  from public,anon,authenticated;
grant execute on function passport_internal.submit_evidence(
  uuid,text,text,text,text,text,text,timestamptz,text,boolean) to service_role;
grant execute on function passport_internal.review_evidence(
  uuid,uuid,integer,public.passport_review_decision,text) to service_role;
commit;
