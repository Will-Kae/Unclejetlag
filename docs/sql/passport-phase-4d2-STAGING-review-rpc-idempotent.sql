-- Phase 4D.2 — REVISED RPC PROTOTYPE. ISOLATED STAGING ONLY. NOT APPLIED.
-- Prerequisite: review-history-idempotency.sql has been applied in staging.
-- This replaces the disabled prototype, but still grants NO client EXECUTE.
-- Approval is unconditionally blocked until independently verified official
-- source checks, conflict serialization, and release-guard compatibility exist.
BEGIN;
CREATE OR REPLACE FUNCTION public.passport_review_submission_staging(
  p_submission_id uuid,
  p_expected_revision integer,
  p_decision public.passport_review_decision,
  p_rationale text,
  p_request_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_submission public.passport_evidence_submissions%ROWTYPE;
  v_existing public.passport_verification_reviews%ROWTYPE;
  v_review_id uuid;
  v_fingerprint text;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF p_request_id IS NULL OR p_expected_revision IS NULL
     OR p_decision IS NULL OR p_submission_id IS NULL THEN
    RAISE EXCEPTION 'missing required review inputs';
  END IF;
  IF length(trim(coalesce(p_rationale,''))) < 10 THEN
    RAISE EXCEPTION 'review rationale too short';
  END IF;
  -- Canonical server-side fingerprint; never accept one from client.
  v_fingerprint := encode(sha256(convert_to(
    jsonb_build_array(p_submission_id::text,p_expected_revision,
      p_decision::text,p_rationale)::text, 'UTF8')), 'hex');
  -- Serialize all review operations on a submission, including retries.
  SELECT * INTO v_submission FROM public.passport_evidence_submissions
    WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'submission not found'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.passport_research_profiles p
    WHERE p.user_id = v_actor AND p.active
      AND p.role IN ('reviewer'::public.passport_role,'admin'::public.passport_role)
  ) OR v_actor = v_submission.submitter_id THEN
    RAISE EXCEPTION 'reviewer not authorized';
  END IF;
  SELECT * INTO v_existing FROM public.passport_verification_reviews
    WHERE request_id = p_request_id;
  IF FOUND THEN
    IF v_existing.reviewer_id = v_actor
       AND v_existing.submission_id = p_submission_id
       AND v_existing.reviewed_revision = p_expected_revision
       AND v_existing.decision = p_decision
       AND v_existing.request_fingerprint = v_fingerprint THEN
      RETURN v_existing.id;
    END IF;
    RAISE EXCEPTION 'request id reused with different review';
  END IF;
  IF v_submission.status <> 'submitted'::public.passport_submission_status
     OR v_submission.revision <> p_expected_revision THEN
    RAISE EXCEPTION 'stale or unsubmitted evidence';
  END IF;
  IF v_submission.revision >= 2147483647 THEN
    RAISE EXCEPTION 'revision limit reached';
  END IF;
  IF p_decision = 'approve'::public.passport_review_decision THEN
    RAISE EXCEPTION 'approval disabled: authoritative source verification unavailable';
  END IF;
  INSERT INTO public.passport_verification_reviews
    (submission_id,reviewer_id,decision,rationale,reviewed_revision,
     request_id,request_fingerprint)
  VALUES (p_submission_id,v_actor,p_decision,p_rationale,p_expected_revision,
          p_request_id,v_fingerprint)
  RETURNING id INTO v_review_id;
  UPDATE public.passport_evidence_submissions
    SET status = CASE p_decision
      WHEN 'reject'::public.passport_review_decision
        THEN 'rejected'::public.passport_submission_status
      ELSE 'changes_requested'::public.passport_submission_status END,
      revision = revision + 1, updated_at = now()
    WHERE id = p_submission_id;
  INSERT INTO public.passport_verification_audit
    (actor_id,action,object_type,object_id,payload)
  VALUES (v_actor,'editorial_review','evidence_submission',p_submission_id,
    jsonb_build_object('review_id',v_review_id,'request_id',p_request_id,
      'reviewed_revision',p_expected_revision,
      'resulting_revision',p_expected_revision+1,'decision',p_decision::text));
  RETURN v_review_id;
END;
$$;
REVOKE ALL ON FUNCTION public.passport_review_submission_staging(
  uuid,integer,public.passport_review_decision,text,uuid)
  FROM PUBLIC,anon,authenticated;
COMMIT;
-- SECURITY REVIEW REMAINING:
-- 1. sha256(bytea) availability must be verified in isolated staging.
-- 2. The five-argument function is a NEW overload. Explicitly DROP the
--    four-argument prototype at controlled cutover; do not leave it exposed.
-- 3. Concurrent calls with same request_id but DIFFERENT submission rows
--    can race; unique index rejects one, but retry semantics must be tested.
-- 4. No new review grant until trusted-source, conflicts, and release
--    transition tests pass.
-- 5. The legacy lifetime reviewer unique index still blocks rereviews.
-- Staging rollback:
-- DROP FUNCTION public.passport_review_submission_staging(
--   uuid,integer,public.passport_review_decision,text,uuid);
