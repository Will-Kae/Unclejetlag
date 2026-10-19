-- Phase 4D.2: TRUSTED SOURCE REGISTRY, STAGING ONLY, NOT APPLIED
-- Run only on isolated staging after DBA/security review.
-- This migration is additive and intentionally grants NO client access.
BEGIN;
CREATE TABLE IF NOT EXISTS public.passport_trusted_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL UNIQUE,
  authority_name text NOT NULL,
  authority_kind text NOT NULL CHECK (authority_kind IN ('government','intergovernmental','official_carrier','official_consular')),
  canonical_host text NOT NULL,
  jurisdiction_code text,
  active boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  verification_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT passport_source_verification_consistent CHECK (
    (active = false) OR (verified_by IS NOT NULL AND verified_at IS NOT NULL AND length(trim(coalesce(verification_notes,''))) > 0)
  ),
  CONSTRAINT passport_source_host_nonempty CHECK (
    canonical_host = lower(canonical_host) AND
    canonical_host !~ '[/ :@]' AND length(canonical_host) > 3
  )
);
ALTER TABLE public.passport_trusted_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.passport_trusted_sources FROM PUBLIC, anon, authenticated;
COMMIT;
-- This table alone does NOT establish authenticity or authorize approvals.
-- Only separately reviewed admin workflow can activate an entry after
-- validating the authoritative domain, provenance, and jurisdiction.
-- Future review RPC must compare source_id AND normalized URL hostname
-- with an active trusted entry, reject subdomain confusion, require dated
-- source evidence and recorded artifact provenance; URL match alone is
-- insufficient for a substantive official-source verification.
-- No seed sources: none have been independently verified.
-- STAGING rollback (only if empty and no dependent functions):
-- DROP TABLE public.passport_trusted_sources;
