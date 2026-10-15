# Phase 4C.3 — Evidence import readiness (review gate)

**Status: NOT READY FOR DATABASE IMPORT.** This document is an audit checklist, not authorization to import or publish.

## Scope and invariants

- All 28 research proposals remain unapproved drafts. Four are disputed and must not be auto-approved.
- No import should update `src/lib/passport/data.ts`, rankings, published destination pages, or release candidates.
- Preserve original source metadata and disputed/pending-verification markers in the research package; do not silently discard them during import.
- The Phase 4C.2 administrator authentication branch and this research branch are independent. Do not merge either automatically.

## Schema mismatch requiring an explicit mapping

`research/phase-4c3/submissions.import.json` contains `research_proposal_id`, `research_status`, `proposed_verification`, and `confidence` in addition to evidence-submission columns. These are **not established as columns** of the current `passport_evidence_submissions` table. Do not use a bulk table insert of the exported rows.

Implement a server-side, authenticated **draft-only** import adapter after the schema and approved RPC contract have been checked. Whitelist only accepted RPC parameters; store or retain the additional research metadata in a separate auditable record if required, rather than losing it. The server must derive `submitter_id` from the verified session, not an import file.

## Preconditions for a controlled test

1. Complete Phase 4C.2 authentication, session expiration/refresh and rate-limit protections.
2. Review and apply least-privilege RLS/grants only after explicit approval, with authenticated role tests and independent-review trigger tests.
3. Confirm actual `passport_internal.submit_evidence` RPC parameter names, permissions, transactional behavior and duplicate handling against Supabase.
4. Add a dry-run validator: package status marker, exact count, unique proposal IDs, valid country codes, HTTPS official sources, source access=`read`, provenance dates, no approved statuses, and existing-record conflict checks.
5. Import at most one approved-for-testing proposal to a **non-production** database or transaction rolled back after testing; verify resulting row is `draft`, belongs to the authenticated researcher, and creates no release candidate.
6. Require a separate human reviewer and audit trail for any future submission approval.

## Research issues blocking publication

- Ghana → Tanzania: official guidelines and embassy lists conflict; request clarification from Tanzania Immigration Services Department.
- Ghana → Namibia: London High Commission guidance may be outdated; confirm against current Namibian ministry guidance.
- Tanzania destination page: Zimbabwe visa-exemption statement and the claimed October 2026 insurance requirement require current primary-source confirmation.
- Malawi destination page: visa fee claim must be reconciled with the immigration department's published schedule.
- Kenya destination page: replace the secondary legal-client alert with a primary government source where available.

## CI interpretation

Unit tests validate the research package shape and exported snapshots. They **do not prove** that Supabase RPCs accept these rows, that RLS permits safe writes, or that source claims are current. GitHub CI and a human source review are separate required gates.

**Release decision: HOLD.** No direct import, no auto-approval, no rankings publication.
