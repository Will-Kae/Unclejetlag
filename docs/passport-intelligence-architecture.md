# Passport Intelligence: architecture and Phase 2B plan

**Status:** 2B-A (monitoring foundation) is implemented on `phase-2b/passport-intelligence`. 2B-B to 2B-D are designed below and need the decisions in section 3 before they can be built safely.

## 1. Repository audit (main @ 4ab1f4d)

| Area | What exists | Consequence |
|---|---|---|
| Passport data | `src/lib/passport/*`, the Phase 2A records | `data.ts` stays authoritative. Nothing in 2B-A writes to it. |
| Dataset size | 640 rules, 23 sources, 199 jurisdictions, 39,402 pairs | |
| Phase 2A safeguards | Publication gate, validators, coverage report, reproducibility snapshot | Kept unchanged |
| Authentication | **None.** No auth library, middleware, sessions or user model. | An admin area cannot be built securely yet (section 3) |
| Persistence | **None.** No database client, ORM or migrations. Everything is static and built at compile time. | 2B-A uses an interface with memory and file stores only |
| Background jobs | **None.** No `vercel.json` crons and no scheduled GitHub workflows. | Nothing runs automatically in 2B-A |
| Notifications | None for operations. Brevo is wired only for the newsletter (`BREVO_*`). | Notification interface comes in 2B-D |
| API routes | `/api/newsletter` only | No new public routes in 2B-A |
| CI | `.github/workflows/preservation-harness.yml`: typecheck, Vitest, build, Playwright, on PRs to `main`, read-only | New tests run there automatically |
| Environment variables in use | `NEXT_PUBLIC_*` (site, AdSense, GA, verification), `BREVO_*`, `NEWSLETTER_*`, `INDEX_UNVERIFIED_CONTENT`, `VERCEL_ENV` | 2B-A adds **none** |
| Deployment | Vercel from `main` (the Vercel connector returns 403, so I couldn't inspect project settings) | No deployment or setting changes |

The Phase 2A documentation called Supabase the "existing" option. That was an assumption: the repository has no Supabase code or configuration.

## 2. Target architecture (all of Phase 2B)

```
                  ┌────────────── public site (unchanged) ──────────────┐
 data.ts ───────► │ publication gate → pages, scores, sitemap            │
 (authoritative)  └──────────────────────────────────────────────────────┘
     ▲
     │ approved release only (2B-D, explicit approval)
     │
 ┌───┴─────────────── Passport Intelligence (private) ───────────────────┐
 │ 2B-A monitor:  registry + configs → safe fetch → extract → fingerprint │
 │                → review items, snapshots, hash-chained audit (Store)   │
 │ 2B-B workflow: evidence submissions, reviewer assignment,              │
 │                independent second review, disputes, approvals          │
 │ 2B-C admin UI: authenticated, role-based, server-only                  │
 │ 2B-D ops:      scheduler, notifications, dataset releases + rollback   │
 └────────────────────────────────────────────────────────────────────────┘
```

**Principles**

- The monitor and workflow never write to `data.ts`.
- Publication changes the site only through a reviewed release (a PR that edits `data.ts` and bumps `DATASET`), until a database-backed release is approved.
- The monitor runs outside the website runtime, so it can't affect production stability.

## 3. Decisions needed before 2B-B to 2B-D (founder approval)

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | Where persistence lives | **Supabase Postgres** (new project), schema in section 6; the `MonitorStore` interface gets a Postgres implementation | Transactional, row-level security, backups, point-in-time recovery on paid plans. The user account already has a Supabase connection, but the repository uses none. |
| D2 | Authentication for the admin area | **Supabase Auth** with email magic link or GitHub OAuth, restricted to an allow-list. Roles in a `passport_roles` table: `admin`, `reviewer`, `researcher`. | One vendor with D1. Server-side session checks in a Next.js route group. No public sign-up. |
| D3 | Where the monitor runs | **GitHub Actions scheduled workflow** (`schedule:` weekly, `concurrency` group) running a Node script | Isolated from Vercel production and from function time limits. Secrets live in GitHub. The run log is visible. |
| D4 | Notifications | Provider-independent interface; first adapter **email via the existing Brevo account** (transactional), or a GitHub issue per review item | Uses infrastructure that already exists |
| D5 | Terms and robots review per source | You (or a delegate) review each of the 23 sources and record it in the monitor config | Required before any source is fetched automatically |
| D6 | Who the independent reviewer is | A named human other than the researcher | "An AI suggestion never counts as independent review" can only be enforced with two human identities |

Until D1–D3 are approved, 2B-B to 2B-D can't be implemented without creating either an insecure admin panel or an unapproved hosted service. The brief forbids both.

## 4. Phase 2B-A (this PR): monitoring foundation

### Modules: `src/lib/passport/monitor/` (server-side only, imported by no page)

| File | Responsibility |
|---|---|
| `url-safety.ts` | `validateSourceUrl`: https only, port 443, no credentials, no IP literals or internal names, host allow-list. `isBlockedAddress`: private, loopback, link-local, CGNAT, metadata, multicast and reserved IPv4/IPv6, including IPv4-mapped, NAT64 and 6to4. `guardedLookup` checks every DNS answer at connect time, which defeats DNS rebinding. |
| `robots.ts` | robots.txt (RFC 9309): own user-agent group, else `*`; wildcards and `$`; longest match wins |
| `fetcher.ts` | `safeFetch`: redirects re-validated on every hop and limited to registry hosts, at most 5 hops. Conditional requests (ETag / Last-Modified, 304). Bounded streaming body. `Accept-Encoding: identity`, so no decompression bombs. Content-type allow-list; status mapping. `withRetry`: back-off for timeouts, network errors, 429 and 5xx only. `nodeHttpsTransport`: no keep-alive, no proxy, guarded DNS. |
| `extract.ts` | `htmlToText`, with no dependency. Per-source start/end markers to cut page furniture; a missing marker is reported. PDF via `pdfjs-dist`, loaded only when needed: magic-number check, no XFA, no font loading, 200-page cap, 20 s timeout. A PDF with no text layer is reported, never guessed. |
| `fingerprint.ts` | Raw hash and normalised-text hash. Clock times and furniture lines are dropped; dates and numbers are kept. Line diff. `classifyChange`: `none` / `cosmetic` / `substantive`, with priority from jurisdiction names and policy terms in the changed lines. |
| `config.ts` | One config per source: strategy `html`, `pdf`, `manual-js` or `manual`; frequency; markers; terms review. **All 23 are disabled** until a terms and robots review is recorded. `validateMonitorConfigs` refuses to enable a source without a positive review. |
| `store.ts` | `MonitorStore` interface; `MemoryStore` (tests); `FileStore` (JSON files plus an append-only `audit.jsonl`). The audit log is hash-chained (`verifyAuditChain`). Open review items are de-duplicated. A lease lock stops overlapping runs. |
| `runner.ts` | `runMonitor`: lock → due sources → robots.txt per host → rate-limited, retried fetch → extract → compare → state, snapshots, audit, review items. `monitorMetrics` reports success rate, open items and backlog age. |

### What a detected change produces

A `content-changed` review item containing:

- the official URL;
- the affected rule ids;
- the removed and added lines (up to 40 each);
- before and after snapshot hashes, whose full text is stored;
- signals and priority;
- this text: "A changed page is not, by itself, evidence of a policy change."

The runner never edits a rule, a source or `Source.checked`. Tests enforce this.

**Other review items:**

| Item | Raised when |
|---|---|
| `source-unavailable` | After 3 consecutive failures; rules stay published and flagged |
| `source-moved-or-removed` | 404/410, or a redirect off the registry, which is not followed |
| `manual-check-required` | robots.txt refusal, an unreachable robots.txt, or 401/403/451; never worked around |
| `extraction-failed` | Corrupt, oversized or scanned document |
| `marker-missing` | The configured start or end marker wasn't found |

### Dependencies, environment variables, migrations

| Item | 2B-A |
|---|---|
| New dependency | `pdfjs-dist@6.3.289` (devDependency, exact version; Mozilla; published 2026-08-29). The site never imports it; a test enforces this. It has no advisories in `npm audit`, and its build contains no `eval` or `new Function`. Requires Node ≥ 22.13 (CI uses Node 22). |
| Environment variables | None |
| Database migrations | None |
| External services | None. Nothing runs on a schedule, and nothing is fetched from live sites, even in tests. |

### Known limitations

- **PDF timeout.** The 20 s PDF timeout stops waiting but can't interrupt a running pdfjs parse. 2B-D should run extraction in a worker thread or a separate process with a memory limit.
- **HTML extraction is regex-based.** It's adequate for change detection but isn't a full parser. Per-source markers reduce noise.
- **JavaScript-rendered pages.** These are `manual-js` only. A headless browser would widen the attack surface and needs its own review.
- **FileStore** is single-writer by design. Concurrent writers need the Postgres store (D1).
- **The production transport ignores HTTP(S) proxies.** The runner must run where direct egress is allowed, such as GitHub Actions.

## 5. Phase 2B-B to 2B-D (designed, not built)

**2B-B: verification workflow**

- Evidence submissions linked to review items.
- Reviewer assignment, with the reviewer required to differ from the submitter, enforced in the database and in code.
- Second-review approval, and dispute resolution that reuses the Phase 2A `transition()`.
- Supporting documents stored as snapshots.
- An `aiAssisted` flag that never satisfies independence.
- **Priority: the 17 `absent-from-list` rules.** For each one, record whether the list is exhaustive, any exceptions found, and any corroborating official evidence.

**2B-C: admin dashboard**

- A `src/app/(admin)/` route group: `noindex`, excluded from the sitemap, server-side session and role checks in each server action, CSRF-safe server actions with origin checks.
- Pages: overview, sources, monitoring, detected changes, queue, approvals, conflicts, coverage, releases, audit.

**2B-D: automation and releases**

- A GitHub Actions schedule (D3) running `runMonitor` against the Postgres store, plus notifications (D4) with de-duplication by review-item key.
- A release workflow: an approved set of rule changes becomes a PR editing `data.ts` and bumping `DATASET`, plus a regenerated snapshot and coverage report.
- Rollback is a revert of that PR, or re-applying a previous `DATASET` version.
- Review-due alerts.
- An optional stricter publication policy, only as a new methodology version.

## 6. Proposed persistence schema (for D1; not created)

| Table | Contents |
|---|---|
| `sources` | Mirror of `data.ts` sources + monitor config |
| `monitor_runs` | `MonitorRun` |
| `source_states` | `SourceMonitorState` |
| `snapshots` | `sha256` PK, text, content type, fetched_at |
| `review_items` | `ReviewItem`, plus assignee and resolution |
| `evidence_submissions` | Rule draft, sources, notes, submitted_by, ai_assisted |
| `reviews` | submission_id, reviewer_id (≠ submitted_by, CHECK and trigger), decision, notes |
| `audit_events` | seq, prev_hash, hash; append-only, with UPDATE and DELETE revoked |
| `dataset_releases` | version, as_of, methodology, rule set hash, approved_by, PR URL |
| `roles` | user_id, role |

**Backups:** daily managed backups plus a weekly `pg_dump` to private storage. Restore is drilled before the first release.
