-- STAGED ONLY. A narrowly scoped PostgREST bridge, not a browser RPC.
-- public is an exposed schema, but these SECURITY INVOKER functions are
-- executable ONLY by service_role. Internal business logic stays private.
begin;
create or replace function public.passport_server_submit(
  p_actor uuid, p_rule_id text, p_passport_code text,
  p_destination_code text, p_access text, p_source_id text,
  p_source_url text, p_observed_at timestamptz,
  p_rationale text, p_ai_assisted boolean
) returns uuid
language sql security invoker set search_path = ''
as $$
  select passport_internal.submit_evidence(
    p_actor,p_rule_id,p_passport_code,p_destination_code,p_access,
    p_source_id,p_source_url,p_observed_at,p_rationale,p_ai_assisted
  );
$$;

create or replace function public.passport_server_review(
  p_actor uuid, p_submission_id uuid, p_revision integer,
  p_decision public.passport_review_decision, p_rationale text
) returns void
language sql security invoker set search_path = ''
as $$
  select passport_internal.review_evidence(
    p_actor,p_submission_id,p_revision,p_decision,p_rationale
  );
$$;

create or replace function public.passport_server_resubmit(
  p_actor uuid, p_submission_id uuid, p_expected_revision integer,
  p_source_id text, p_source_url text, p_observed_at timestamptz,
  p_rationale text, p_ai_assisted boolean
) returns integer
language sql security invoker set search_path = ''
as $$
  select passport_internal.resubmit_evidence(
    p_actor,p_submission_id,p_expected_revision,p_source_id,
    p_source_url,p_observed_at,p_rationale,p_ai_assisted
  );
$$;

revoke all on function public.passport_server_submit(
  uuid,text,text,text,text,text,text,timestamptz,text,boolean)
  from public,anon,authenticated;
revoke all on function public.passport_server_review(
  uuid,uuid,integer,public.passport_review_decision,text)
  from public,anon,authenticated;
revoke all on function public.passport_server_resubmit(
  uuid,uuid,integer,text,text,timestamptz,text,boolean)
  from public,anon,authenticated;
grant execute on function public.passport_server_submit(
  uuid,text,text,text,text,text,text,timestamptz,text,boolean) to service_role;
grant execute on function public.passport_server_review(
  uuid,uuid,integer,public.passport_review_decision,text) to service_role;
grant execute on function public.passport_server_resubmit(
  uuid,uuid,integer,text,text,timestamptz,text,boolean) to service_role;
commit;
