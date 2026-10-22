-- Phase 4D.2 — ISOLATED STAGING ONLY, NOT APPLIED.
-- Idempotency + per-revision review-history candidate.
-- Must be executed only as part of a reviewed migration on disposable staging.
BEGIN;
-- Preflight assertions should run before DDL in the migration runner:
-- * no null reviewed_revision values
-- * no duplicate (submission_id, reviewed_revision, reviewer_id)
-- * no release-linked mutation during maintenance window
ALTER TABLE public.passport_verification_reviews
  ADD COLUMN IF NOT EXISTS request_id uuid,
  ADD COLUMN IF NOT EXISTS request_fingerprint text;
-- Existing historical reviews intentionally remain NULL. New RPC writes both.
ALTER TABLE public.passport_verification_reviews
  ADD CONSTRAINT passport_review_request_pair_consistent CHECK (
    (request_id IS NULL AND request_fingerprint IS NULL)
    OR (request_id IS NOT NULL AND request_fingerprint IS NOT NULL
        AND length(request_fingerprint) = 64
        AND request_fingerprint ~ '^[0-9a-f]{64}$')
  );
CREATE UNIQUE INDEX passport_review_request_id_unique
  ON public.passport_verification_reviews(request_id)
  WHERE request_id IS NOT NULL;
CREATE UNIQUE INDEX passport_review_revision_reviewer_unique_idx
  ON public.passport_verification_reviews(submission_id, reviewed_revision, reviewer_id);
-- IMPORTANT: do not remove the legacy lifetime uniqueness yet.
-- It is removed only in the coordinated cutover after the revised RPC and
-- request_changes -> resubmit tests pass. Until then this migration remains
-- additive and the old behavior remains intentionally enforced.
COMMIT;
-- RPC contract for new reviews:
-- 1. client generates request_id for one intentional action.
-- 2. server derives reviewer identity; canonicalizes trusted inputs and computes
--    SHA-256 fingerprint itself. Never trust a client-provided fingerprint.
-- 3. on request_id collision, return existing result only if actor, submission,
--    expected revision, decision and server-computed fingerprint all match.
-- 4. otherwise reject replay/key reuse.
-- 5. review insert + status/revision transition + audit insert are atomic.
--
-- Coordinated staging cutover, only after tests:
-- DROP INDEX public.passport_verification_reviews_submission_id_reviewer_id_key;
-- (Confirm actual object type/name immediately before cutover.)
--
-- Staging rollback while legacy index is still present:
-- DROP INDEX IF EXISTS public.passport_review_revision_reviewer_unique_idx;
-- DROP INDEX IF EXISTS public.passport_review_request_id_unique;
-- ALTER TABLE public.passport_verification_reviews
--   DROP CONSTRAINT IF EXISTS passport_review_request_pair_consistent,
--   DROP COLUMN IF EXISTS request_fingerprint,
--   DROP COLUMN IF EXISTS request_id;
