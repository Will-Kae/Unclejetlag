# Phase 4D.2 — Source verification integration contract

Development-only design; no database changes or public release.

The pure policy in `src/lib/passport/editorial-source-policy.ts` is **not** an authorization boundary. Its booleans must never be accepted from browser input. A future authenticated, locked database transaction must derive these facts from trusted database rows and verified artifact provenance.

## Mandatory verification
1. Resolve `source_id` to an active registry entry with documented independent authority verification.
2. Parse the evidence URL using a real URL parser; compare the normalized hostname against the exact trusted canonical host (or a separately verified subdomain record). Reject redirects, lookalikes and host suffix tricks.
3. Require a source document date, independently checked official content, and an auditable artifact/provenance record.
4. Verify the source supports the **specific passport/destination/access claim**, not merely that the domain is official.
5. Recheck unresolved conflicts and revision under row locks before committing.
6. Require independent active reviewer, insert review, transition revision and append audit atomically.
7. Keep all approval endpoints disabled until these server-side checks and staging tests exist.

## Negative staging tests
Unlisted source; inactive source; forged client-side verified flag; mismatched source_id; lookalike hostname; unsupported subdomain; missing artifact; stale document; unsubstantiated claim; concurrent dispute; self-review; stale revision; failed audit insert.

The source registry migration is only a schema draft. No official sources have been verified or activated.
