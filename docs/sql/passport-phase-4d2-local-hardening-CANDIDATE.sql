-- Phase 4D.2 local-only hardening candidate. NOT production authorized.
-- Reviewed against reported disposable PostgreSQL 17 schema, 2026-10-20.
-- Apply ONLY to passport_concurrency_test after independent inspection.
-- This is NOT a source-verification or approval-enabling migration.
-- Requires pre-apply backup and DBA review before any staging promotion.
BEGIN;

CREATE OR REPLACE FUNCTION public.passport_protect_approved_evidence()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'approved' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Approved evidence is immutable; create a new submission for review';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.passport_protect_approved_evidence()
  FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS passport_approved_evidence_update_guard
  ON public.passport_evidence_submissions;
CREATE TRIGGER passport_approved_evidence_update_guard
BEFORE UPDATE ON public.passport_evidence_submissions
FOR EACH ROW EXECUTE FUNCTION public.passport_protect_approved_evidence();

CREATE OR REPLACE FUNCTION public.passport_prevent_approved_evidence_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'Approved evidence cannot be deleted';
  END IF;
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION public.passport_prevent_approved_evidence_delete()
  FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS passport_approved_evidence_delete_guard
  ON public.passport_evidence_submissions;
CREATE TRIGGER passport_approved_evidence_delete_guard
BEFORE DELETE ON public.passport_evidence_submissions
FOR EACH ROW EXECUTE FUNCTION public.passport_prevent_approved_evidence_delete();

-- Release-link and conflict inserts serialize on the same evidence row.
-- Isolation assumption: PostgreSQL READ COMMITTED; verify separately for
-- higher isolation levels, deferred constraints and privileged writers.
CREATE OR REPLACE FUNCTION public.passport_protect_linked_conflicts()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE v_submission_id uuid;
BEGIN
  SELECT id INTO v_submission_id
  FROM public.passport_evidence_submissions
  WHERE id = NEW.submission_id FOR UPDATE;
  IF v_submission_id IS NULL THEN
    RAISE EXCEPTION 'Evidence submission missing';
  END IF;
  IF NEW.status = 'open' AND EXISTS (
    SELECT 1 FROM public.passport_release_candidate_submissions
    WHERE submission_id = NEW.submission_id
  ) THEN
    RAISE EXCEPTION 'Open conflict prohibited for release-linked evidence';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.passport_protect_linked_conflicts()
  FROM PUBLIC, anon, authenticated, service_role;
-- Preserve existing passport_linked_conflict_guard trigger.

CREATE OR REPLACE FUNCTION public.passport_check_release_candidate()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE evidence public.passport_evidence_submissions%ROWTYPE;
BEGIN
  SELECT * INTO evidence FROM public.passport_evidence_submissions
  WHERE id = NEW.submission_id FOR UPDATE;
  IF evidence.id IS NULL OR evidence.status <> 'approved'
     OR evidence.revision <= 1 THEN
    RAISE EXCEPTION 'Approved evidence required for release candidate';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.passport_verification_conflicts
    WHERE submission_id = NEW.submission_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Unresolved conflict blocks release candidate';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.passport_verification_reviews r
    JOIN public.passport_research_profiles p ON p.user_id = r.reviewer_id
    WHERE r.submission_id = NEW.submission_id
      AND r.reviewed_revision = evidence.revision - 1
      AND r.reviewer_id <> evidence.submitter_id
      AND r.decision = 'approve'
      AND p.active = true
      AND p.role IN ('reviewer', 'admin')
  ) THEN
    RAISE EXCEPTION 'Current revision requires independent approval';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.passport_check_release_candidate()
  FROM PUBLIC, anon, authenticated, service_role;
-- Preserve existing passport_release_candidate_guard trigger.

-- Do not grant review RPC EXECUTE. Existing five-argument approval branch
-- must remain unconditionally disabled pending authoritative source validation.
DO $$
BEGIN
  IF has_function_privilege('authenticated',
    'public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)',
    'EXECUTE') THEN
    RAISE EXCEPTION 'STOP: review RPC executable by authenticated';
  END IF;
END;
$$;
COMMIT;

-- Rollback plan: do NOT blindly drop protections after they are in use.
-- Restore previous reviewed function bodies under a coordinated write freeze,
-- retaining all historical audit, review and release-link records.
-- TODO before any production consideration:
-- verified source registry + claim provenance, atomic approval/audit,
-- effective grants and RLS, DELETE/TRUNCATE pathways, cross-isolation races,
-- source revocation, final integration regression and independent DBA signoff.
