-- Phase 2B security hardening (STAGED ONLY; do not deploy before full workflow review).
-- Preserve historic reviews and allow the same reviewer to assess a later revision.
-- Run first against a disposable development database with realistic test fixtures.
begin;

alter table public.passport_verification_reviews
  drop constraint if exists passport_verification_reviews_submission_id_reviewer_id_key;

alter table public.passport_verification_reviews
  add constraint passport_reviews_one_per_reviewer_revision
  unique (submission_id, reviewer_id, reviewed_revision);

-- Trigger functions need no direct EXECUTE privilege for client roles.
revoke all on function public.passport_audit_immutable() from public, anon, authenticated;
revoke all on function public.passport_enforce_independent_review() from public, anon, authenticated;

-- A review must be bound to the current revision; approved evidence remains frozen
-- through the existing release-link protection trigger.
commit;
