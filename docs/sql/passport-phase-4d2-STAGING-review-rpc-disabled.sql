-- PHASE 4D.2 — ISOLATED STAGING ONLY. UNAPPLIED. FAIL CLOSED.
-- This SQL defines a guarded RPC but does NOT grant EXECUTE to clients.
-- Review independently before running on a disposable staging database.
BEGIN;
CREATE OR REPLACE FUNCTION public.passport_review_submission_staging(
  p_submission_id uuid,
  p_expected_revision integer,
  p_decision public.passport_review_decision,
  p_rationale text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor uuid;
  v_submission public.passport_evidence_submissions%ROWTYPE;
  v_review_id uuid;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO v_submission FROM public.passport_evidence_submissions
    WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'submission not found'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.passport_research_profiles p
    WHERE p.user_id = v_actor AND p.active = true
      AND p.role IN ('reviewer'::public.passport_role,'admin'::public.passport_role)
  ) THEN RAISE EXCEPTION 'active reviewer required'; END IF;
  IF v_actor = v_submission.submitter_id THEN RAISE EXCEPTION 'self-review prohibited'; END IF;
  IF v_submission.status <> 'submitted'::public.passport_submission_status
     OR v_submission.revision <> p_expected_revision THEN
    RAISE EXCEPTION 'stale or unsubmitted evidence';
  END IF;
  IF length(trim(coalesce(p_rationale,''))) < 10 THEN
    RAISE EXCEPTION 'review rationale too short';
  END IF;
  IF p_decision = 'approve'::public.passport_review_decision THEN
    -- NO AUTHENTICATED SOURCE REGISTRY / CLAIM VALIDATOR IS DEPLOYED.
    -- Do not remove this unconditional fail-closed gate until official
    -- source verification and artifact validation are implemented and
    -- independently tested server-side.
    RAISE EXCEPTION 'approval disabled: authoritative source verification unavailable';
  END IF;
  INSERT INTO public.passport_verification_reviews
    (submission_id,reviewer_id,decision,rationale,reviewed_revision)
  VALUES (p_submission_id,v_actor,p_decision,p_rationale,p_expected_revision)
  RETURNING id INTO v_review_id;
  UPDATE public.passport_evidence_submissions
    SET status = CASE p_decision
      WHEN 'reject'::public.passport_review_decision
        THEN 'rejected'::public.passport_submission_status
      ELSE 'changes_requested'::public.passport_submission_status END,
      revision = revision + 1,
      updated_at = now()
    WHERE id = p_submission_id;
  INSERT INTO public.passport_verification_audit
    (actor_id,action,object_type,object_id,payload)
  VALUES (v_actor,'editorial_review','evidence_submission',p_submission_id,
    jsonb_build_object('review_id',v_review_id,
      'reviewed_revision',p_expected_revision,
      'resulting_revision',p_expected_revision+1,
      'decision',p_decision::text));
  RETURN v_review_id;
END;
$$;
REVOKE ALL ON FUNCTION public.passport_review_submission_staging(
  uuid,integer,public.passport_review_decision,text) FROM PUBLIC, anon, authenticated;
COMMIT;
-- This RPC has NO client execute grant. It is NOT production-ready.
-- Current lifetime reviewer uniqueness still prevents same-reviewer rereview.
-- A complete version needs verified source checks, idempotency, dispute
-- serialization and new uniqueness semantics before any grant.
-- Staging rollback:
-- DROP FUNCTION public.passport_review_submission_staging(
--   uuid,integer,public.passport_review_decision,text);
