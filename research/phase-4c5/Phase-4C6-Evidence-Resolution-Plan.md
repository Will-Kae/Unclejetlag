# Phase 4C.6 — Evidence resolution plan (draft-only)

Date: 2026-10-19. Scope: editorial research and validation. No visa classification, scoring, publication, Supabase mutation, merge, or production deployment is authorized by this plan.

## Priority investigations

| Priority | Case | Current defensible position | Evidence needed to close | Release gate |
| --- | --- | --- | --- | --- |
| P0 | Ghana ordinary passport → Tanzania | Existing visa-free classification remains unchanged but flagged for re-verification; Tanzania 2026 guidelines contradict themselves between §6 and §7 | Dated written clarification from Tanzania Immigration Services Department that explicitly names Ghana, passport class, and entry category | Reviewer resolves contradiction with primary-source evidence |
| P0 | Zimbabwe ordinary passport → Tanzania | Unverified; do not import disputed proposal | Current dated Tanzanian immigration notice or written departmental confirmation naming Zimbabwe | Reviewer approves a consistent official source |
| P0 | Nigeria ordinary passport → Tanzania | Unverified; do not infer from Commonwealth membership alone | Clarification reconciling 2026 guidelines §6 and §7 | No automated approval |
| P0 | Eswatini ordinary passport → Namibia | Unverified; embassy exemption lists differ | Current Namibian ministry ordinary-passport exemption/VOA schedule | Reviewer validates passport type |
| P1 | Ghana ordinary passport → Namibia | Existing visa-on-arrival record unchanged, with fact-sheet caveat | Ministry-hosted current VOA list or written ministry confirmation | Verify ordinary versus diplomatic passport |
| P1 | Tanzania inbound travel insurance | Mandatory scheme evidenced; start date, resident/citizen exemptions and Zanzibar overlap unresolved | Official Gazette Notice No. 256/2026 and NIC terms; effective date and exceptions quoted exactly | No unsupported start-date or exemption claims in destination copy |
| P1 | Malawi single-entry visa fee | Immigration department lists USD 75 online; embassies list USD 50 | Current official fee schedule specifying online vs consular charges and effective dates | Distinguish channels; do not silently choose one amount |
| P2 | Ghana entry policy for African passports | Announcement alone does not prove visa-free entry without eVisa/eTA | GIS eligibility result and published legal instrument | Per-passport verification before import |
| P2 | Malawi visa-exemption list | Unverified for many African passports | Official dated exemption schedule, including ordinary-passport scope | Per-passport verification before import |

## Evidence intake contract

For each claim record: passport ISO alpha-3, destination ISO alpha-3, ordinary/diplomatic/official passport class, claimed visa category, stay duration, travel purpose, effective date, source issuing authority, canonical official URL, source document date, retrieval date, quoted provision/section, screenshot or archival reference if legally permitted, contradiction notes, and reviewer decision. A URL or embassy list without passport-class scope is not sufficient to close a disputed case.

## Decision rules

1. Keep conflicting cases **unverified** unless an existing published classification is under re-verification; in that case preserve the published value and prominently retain the dispute flag. Never silently replace it.
2. Prefer current laws, gazettes, and immigration-department publications over undated mission lists; contradictory primary sources still require explicit resolution.
3. Separate **visa requirement**, **eVisa/eTA application**, **fee**, **insurance**, and **stay duration**. A waived fee does not imply waived entry authorization.
4. No evidence submission is an approval. Reviewer sign-off, audit trail, and an explicit release authorization are required for publishing.
5. Do not count unverified pairs in World Passport Index rankings. Rankings remain unpublished until independent scoring and coverage gates are met.

## Researcher handoff

Draft concise clarification requests to Tanzania Immigration, Namibia Home Affairs, Malawi Immigration, and Ghana Immigration Service, citing the precise conflict and requesting a dated public notice or written response. Do not send requests or disclose credentials without owner approval. Attach responses to the evidence-review workflow, not directly to published dataset rows.

## Verification gates

- Existing Phase 4C.4 baseline: 0 evidence errors and 83 warnings; warnings remain unresolved until substantiated by new sources.
- Kenya's 14 official-source-supported records need no reclassification from this plan.
- Re-run evidence-quality, proposal-quality, and preservation harness tests after any future code/data change.
- All work remains on draft PR #18. No production deployment or database writes.

Source context: `research/phase-4c4/Phase-4C4-Evidence-Quality-Report.md` and `research/phase-4c4/Phase-4C4-Verification-Backlog.csv`. This plan is based on previously collected evidence, not a fresh independent verification of external websites.
