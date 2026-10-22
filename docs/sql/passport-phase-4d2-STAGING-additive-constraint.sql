-- Phase 4D.2 isolated-STAGING candidate, NOT APPLIED.
-- Requires security review, isolated clone, verified official-source registry.
-- This file deliberately fails closed: it does not grant any approval RPC.
-- Existing production permissions, triggers and data remain untouched.
BEGIN;
-- Replace lifetime uniqueness with per-revision uniqueness in a controlled
-- staging migration. Lock and validate duplicates before removing old rule.
ALTER TABLE public.passport_verification_reviews
  ADD CONSTRAINT passport_reviews_revision_reviewer_unique
  UNIQUE (submission_id, reviewed_revision, reviewer_id);
-- This is intentionally additive. Existing lifetime unique constraint stays
-- until the full request_changes -> resubmit -> rereview lifecycle is tested.
-- No SECURITY DEFINER RPC is created before source verification is designed.
COMMIT;

-- STAGING VALIDATION (run separately, in a disposable staging database):
-- 1. Existing review inserts still obey independence and submitted/revision guards.
-- 2. Confirm new unique constraint exists and no data was modified.
-- 3. Check that legacy unique index blocks repeat reviews (known blocker).
-- 4. Do not advance to production until new review RPC, release guard,
--    trusted-source validation and audit atomicity are implemented/tested.
--
-- REVERT (staging only):
-- ALTER TABLE public.passport_verification_reviews
--   DROP CONSTRAINT IF EXISTS passport_reviews_revision_reviewer_unique;
