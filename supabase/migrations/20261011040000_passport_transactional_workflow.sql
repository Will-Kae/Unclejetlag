-- Transactional evidence submission, review and audit.
-- RPC derives actor from verified auth.uid() and checks an active profile.
-- SECURITY DEFINER bypasses RLS; execution is explicitly restricted to authenticated.
-- Keep functions narrowly scoped and never accept caller-supplied actor IDs.
create or replace function public.passport_submit_evidence(
  p_rule_id text,
  p_passport_code text,
  p_destination_code text,
  p_access text,
  p_source_id text,
  p_source_url text,
  p_observed_at timestamptz,
  p_rationale text,
  p_ai_assisted boolean
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.passport_research_profiles
    where user_id = v_actor and active and role in ('researcher', 'admin')
  ) then raise exception 'Unauthorized researcher'; end if;
  if p_source_url !~ '^https://' or length(trim(p_rationale)) < 20
     or p_passport_code !~ '^[A-Z]{3}$' or p_destination_code !~ '^[A-Z]{3}$'
     or p_rule_id is null or length(trim(p_rule_id)) = 0
     or p_source_id is null or length(trim(p_source_id)) = 0
     or p_access is null or length(trim(p_access)) = 0
     or p_observed_at is null or p_ai_assisted is null
  then raise exception 'Invalid evidence'; end if;

  insert into public.passport_evidence_submissions (
    rule_id, passport_code, destination_code, proposed_access,
    source_id, source_url, observed_at, rationale, ai_assisted,
    submitter_id, status
  ) values (
    p_rule_id, p_passport_code, p_destination_code, p_access,
    p_source_id, p_source_url, p_observed_at, p_rationale, p_ai_assisted,
    v_actor, 'submitted'
  ) returning id into v_id;

  insert into public.passport_verification_audit(actor_id, action, object_type, object_id, payload)
  values (v_actor, 'evidence_submitted', 'evidence_submission', v_id, '{}'::jsonb);
  return v_id;
end;
$$;

create or replace function public.passport_review_evidence(
  p_submission_id uuid,
  p_revision integer,
  p_decision public.passport_review_decision,
  p_rationale text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_submitter uuid;
  v_actor uuid := (select auth.uid());
  v_revision integer;
  v_status public.passport_submission_status;
begin
  select submitter_id, revision, status
  into v_submitter, v_revision, v_status
  from public.passport_evidence_submissions
  where id = p_submission_id for update;

  if v_submitter is null or v_status <> 'submitted' or v_revision <> p_revision then
    raise exception 'Stale or unavailable submission';
  end if;
  if v_actor is null then raise exception 'Authentication required'; end if;
  if v_actor = v_submitter then raise exception 'Self-review prohibited'; end if;
  if v_actor is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.passport_research_profiles
    where user_id = v_actor and active and role in ('reviewer', 'admin')
  ) then raise exception 'Unauthorized reviewer'; end if;
  if length(trim(coalesce(p_rationale, ''))) < 20 then raise exception 'Review rationale required'; end if;

  insert into public.passport_verification_reviews(
    submission_id, reviewer_id, reviewed_revision, decision, rationale
  ) values (p_submission_id, v_actor, p_revision, p_decision, p_rationale);

  update public.passport_evidence_submissions set
    status = case p_decision
      when 'approve' then 'approved'::public.passport_submission_status
      when 'reject' then 'rejected'::public.passport_submission_status
      else 'changes_requested'::public.passport_submission_status end,
    updated_at = now()
  where id = p_submission_id;

  insert into public.passport_verification_audit(actor_id, action, object_type, object_id, payload)
  values (v_actor, 'evidence_reviewed', 'evidence_submission', p_submission_id,
    jsonb_build_object('decision', p_decision, 'revision', p_revision));
end;
$$;

revoke all on function public.passport_submit_evidence(text,text,text,text,text,text,timestamptz,text,boolean) from public, anon, authenticated;
revoke all on function public.passport_review_evidence(uuid,integer,public.passport_review_decision,text) from public, anon, authenticated;
grant execute on function public.passport_submit_evidence(text,text,text,text,text,text,timestamptz,text,boolean) to authenticated;
grant execute on function public.passport_review_evidence(uuid,integer,public.passport_review_decision,text) to authenticated;
