-- STAGED ONLY: apply after 20261012090000 hardening on a disposable DB.
-- Server-only, atomic resubmission of changes-requested evidence.
-- Caller must be trusted server code using the service_role; actor ID must be
-- taken from a separately verified user session, never from a browser payload.
begin;
create schema if not exists passport_internal;
revoke all on schema passport_internal from public, anon, authenticated;
grant usage on schema passport_internal to service_role;

create or replace function passport_internal.resubmit_evidence(
  p_actor uuid,
  p_submission_id uuid,
  p_expected_revision integer,
  p_source_id text,
  p_source_url text,
  p_observed_at timestamptz,
  p_rationale text,
  p_ai_assisted boolean
) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_row public.passport_evidence_submissions%rowtype;
  v_revision integer;
begin
  if p_actor is null or p_submission_id is null or p_expected_revision is null then
    raise exception 'Missing actor, submission or revision';
  end if;
  select * into v_row from public.passport_evidence_submissions
    where id = p_submission_id for update;
  if not found or v_row.status <> 'changes_requested'
     or v_row.revision <> p_expected_revision then
    raise exception 'Unavailable or stale resubmission';
  end if;
  if v_row.submitter_id <> p_actor then
    raise exception 'Only the original submitter may resubmit';
  end if;
  if not exists (
    select 1 from public.passport_research_profiles
    where user_id = p_actor and active = true and role in ('researcher', 'admin')
  ) then
    raise exception 'Active researcher required';
  end if;
  if p_source_id is null or length(btrim(p_source_id)) = 0
     or p_source_url is null or p_source_url !~ '^https://[^[:space:]]+$'
     or p_observed_at is null or p_ai_assisted is null
     or length(btrim(coalesce(p_rationale, ''))) < 20 then
    raise exception 'Invalid resubmission evidence';
  end if;
  update public.passport_evidence_submissions
  set source_id = p_source_id,
      source_url = p_source_url,
      observed_at = p_observed_at,
      rationale = p_rationale,
      ai_assisted = p_ai_assisted,
      revision = revision + 1,
      status = 'submitted',
      updated_at = now()
  where id = p_submission_id
  returning revision into v_revision;

  insert into public.passport_verification_audit
    (actor_id, action, object_type, object_id, payload)
  values (p_actor, 'evidence_resubmitted', 'evidence_submission', p_submission_id,
    pg_catalog.jsonb_build_object('previous_revision', p_expected_revision,
      'new_revision', v_revision, 'previous_status', 'changes_requested'));
  return v_revision;
end;
$$;

revoke all on function passport_internal.resubmit_evidence(
  uuid,uuid,integer,text,text,timestamptz,text,boolean
) from public, anon, authenticated;
grant execute on function passport_internal.resubmit_evidence(
  uuid,uuid,integer,text,text,timestamptz,text,boolean
) to service_role;

-- Prevent changing previously approved or rejected evidence even via a
-- privileged caller; release-linked evidence remains covered by its own guard.
create or replace function public.passport_guard_submission_transition()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if old.status in ('approved', 'rejected') and new is distinct from old then
    raise exception 'Finalized evidence is immutable';
  end if;
  if old.status = 'changes_requested' and new is distinct from old then
    if new.status <> 'submitted'
       or new.revision <> old.revision + 1
       or new.id is distinct from old.id
       or new.submitter_id is distinct from old.submitter_id
       or new.rule_id is distinct from old.rule_id
       or new.passport_code is distinct from old.passport_code
       or new.destination_code is distinct from old.destination_code
       or new.created_at is distinct from old.created_at then
      raise exception 'Invalid resubmission transition';
    end if;
  elsif old.status = 'submitted' and new is distinct from old then
    if new.status not in ('approved', 'rejected', 'changes_requested')
       or new.revision <> old.revision
       or (to_jsonb(new) - 'status' - 'updated_at') <>
          (to_jsonb(old) - 'status' - 'updated_at') then
      raise exception 'Only review status may change on submitted evidence';
    end if;
  elsif new is distinct from old then
    raise exception 'Unsupported evidence transition';
  end if;
  return new;
end;
$$;
drop trigger if exists passport_submission_transition_guard
  on public.passport_evidence_submissions;
create trigger passport_submission_transition_guard
before update on public.passport_evidence_submissions
for each row execute function public.passport_guard_submission_transition();
revoke all on function public.passport_guard_submission_transition()
  from public, anon, authenticated;
commit;
