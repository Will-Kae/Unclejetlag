# World Passport Index: official-source monitoring (design)

**Status:**

- **Phase 2A:** design and decision logic (`src/lib/passport/monitoring.ts`).
- **Phase 2B-A:** the monitoring foundation is implemented in `src/lib/passport/monitor/`: safe fetcher, robots.txt, HTML/PDF extraction, fingerprints, store, runner.
- **Nothing runs on a schedule yet.** Every source is disabled until its terms and robots.txt are reviewed.
- Architecture and remaining decisions are in [`passport-intelligence-architecture.md`](./passport-intelligence-architecture.md).

## Principles

1. **Detect, don't publish.**
   - A changed page creates a review task.
   - It never changes, adds or removes a visa rule.
   - A person reads the source and applies a `transition()`.
2. **Respect access controls.**
   - A source is checked automatically only after its terms and `robots.txt` have been reviewed.
   - A robots disallow, login, CAPTCHA or bot challenge switches the source to `manual`, logged and with a task raised. The monitor never works around it.
   - The monitor sends an honest user agent and never imitates a browser.
3. **Outages are not policy changes.**
   - Failures retry with back-off.
   - After 3 consecutive failed checks a `source-unavailable` task is raised.
   - Rules stay published and are flagged, then become review-due on the normal schedule.
4. **Everything is logged.** Every check, outcome, mode change and task is appended to an audit log, which is never edited.

## Policy (`MONITOR_POLICY`)

| Setting | Value |
|---|---|
| User agent | `UncleJetlagSourceMonitor/0.1 (+https://unclejetlag.com/passport-index/data-sources)` |
| Rate limit | 2 requests per host per minute (`scheduleByHost` spreads checks) |
| Minimum interval per source | 7 days |
| Retries within one check | 3 attempts, with back-off of 1 min, 5 min and 30 min |
| Request timeout | 30 s |
| Failures before an unavailable task | 3 consecutive |

## Change detection

- `normaliseForHash()` strips scripts, styles, comments, tags and clock times, and collapses whitespace before hashing. Cosmetic edits shouldn't raise tasks.
- When unsure, a change raises a task. A false alarm costs a re-read; a missed change costs a wrong rule.
- PDFs (EU regulation, Ireland list, Namibia fact sheet) need text extraction before hashing; that's for the Phase 2B runner.

## Check outcomes → actions (`evaluateCheck`)

| Outcome | State change | Task |
|---|---|---|
| unchanged | failures reset, last OK time set | none (audit only) |
| changed (hash differs) | hash updated | `content-changed`, listing the affected rule ids |
| http-error / timeout | failures + 1 | `source-unavailable` at the 3rd consecutive failure |
| not-found | failures + 1 | `source-moved-or-removed` (find the official replacement) |
| blocked / robots-disallowed | mode → manual | `manual-check-required` |

Independently of monitoring, every rule becomes `review-due` 180 days after its source was read (methodology v0.1).

## Current state

| Item | State |
|---|---|
| Sources | All 23 are `manual`. None has had a terms or robots review for automated access. |
| Portals that block readers | Several African immigration portals are JavaScript-only or block automated readers, so they may stay manual permanently. |
| Next due re-reads | 23 March 2027 (3 sources) and 8 April 2027 (20 sources) |

## Phase 2B (needs approval)

1. **Choose where it runs.** Vercel Cron or a GitHub Actions schedule.
2. **Choose storage.** A new hosted database needs its own architecture decision, so start with a git-committed audit log or Supabase.
3. **Review each source's terms and `robots.txt`.** Record the result, then switch eligible sources to `automated`.
4. **Build the runner.** Fetch, normalise, hash, call `evaluateCheck`, append to the audit log and open review tasks (for example as GitHub issues).
