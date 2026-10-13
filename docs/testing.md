# Preservation harness (Uncle Jetlag 2.0, Phase 1A)

Automated checks that protect what already works while the site is restructured. They test only;
they change no application behaviour.

## Run locally

```bash
npm test                                   # unit, data and affiliate contract tests (Vitest)
NEXT_PUBLIC_SITE_URL=https://unclejetlag.com npm run build
npm run test:e2e                           # routes, sitemap, links, integrations (Playwright)
```

First run on a new machine: `npx playwright install chromium`.

CI (`.github/workflows/preservation-harness.yml`) runs both on every pull request to `main`.

## What is protected

| Area | Test | Baseline |
|---|---|---|
| Affiliate redirects: exact target URLs, referral/affiliate IDs, sub-ID names, default campaign `uj`, 302 + noindex + no-store, inactive/unknown fallback | `tests/affiliate-contract.test.ts` | `tests/fixtures/affiliate-contract.json` |
| Sitemap: additions/removals need review | `e2e/routes.spec.ts` | `tests/fixtures/sitemap-paths.json` (219) |
| Every sitemap URL is 200 and indexable | `e2e/routes.spec.ts` | live from the build |
| Known noindex pages stay 200 + noindex | `e2e/routes.spec.ts` | `tests/fixtures/noindex-paths.json` (189) |
| Redirect status codes and destinations, incl. www → apex | `e2e/routes.spec.ts` | `tests/fixtures/redirects.json` (12) |
| Unknown routes return a real 404 | `e2e/routes.spec.ts` | — |
| Broken internal links (new ones fail; fixed allowlisted ones fail too) | `e2e/links.spec.ts` | `tests/fixtures/known-broken-links.json` (34, dated 2026-10-10) |
| Partner integrations (tools loaded via their Load buttons since Phase 3A; the flight search via "Allow and load flight search"): Travelpayouts site snippet (inert until ads consent) + flights widget params, Expedia embed IDs, DiscoverCars attributes, Genki iframe + links, World Nomads CJ link, CJ pixel consent gating, Impact verification, booking tabs, hub partner links | `e2e/widgets.spec.ts` | values in the spec |
| Consent (Phase 3A): no third-party request before consent or after "Essential only" (12 page types, client-side navigation included); a tool's Load button loads only that tool and never grants advertising consent; "Accept all" loads Drive and tools; withdrawal reloads and loads nothing | `e2e/consent.spec.ts`, `tests/consent-services.test.ts` | see `docs/consent.md` |
| Country identifiers: destination registry, Passport Index jurisdictions, banking ISO set and guides, bank slugs, eSIM slugs, region keys, content files | `tests/data-consistency.test.ts` | `tests/fixtures/registry-snapshot.json` |
| Visa briefs agree with the Passport Index; every rule cites a registered source | `tests/data-consistency.test.ts` | — |
| Accessibility: axe-core WCAG 2.0/2.1/2.2 A+AA on 13 representative pages + result states, desktop and mobile; cookie banner; skip link; visible focus on the first 30 tab stops | `e2e/accessibility.spec.ts` | zero violations |
| Colour tokens: Passport Index category colours >= 4.5:1 with white; text tokens >= 4.5:1 on white and paper; focus ring >= 3:1 | `tests/accessibility-tokens.test.ts` | values in `globals.css` / `src/lib/passport/types.ts` |
| Passport data integrity (Phase 2A): canonical identifiers, rule uniqueness and conflicts, source references, dates and freshness, verification transitions, publication gate, unknown vs restricted, monitoring decisions | `tests/passport-provenance.test.ts` | validators in `src/lib/passport/validation.ts` |
| Passport scores and ranking gate reproducible for the dataset version and methodology; methodology weights and thresholds unchanged | `tests/passport-provenance.test.ts` | `tests/fixtures/passport-index-snapshot.json` |
| Passport coverage report is current | `tests/passport-provenance.test.ts` | `reports/passport-coverage.json` (`npm run passport:coverage`) |
| Passport source monitor (Phase 2B-A): SSRF and URL safety, redirects, robots.txt, conditional requests, retries, size limits, HTML/PDF extraction and failures, cosmetic vs substantive changes, review items, hash-chained audit, run lock, no writes to sources/rules, isolation from the public site | `tests/passport-monitor.test.ts` | mocked transport; PDFs in `tests/fixtures/monitor/` |
| Monitor security hardening (PR #7): robots.txt on every redirect hop, fail-closed config validation with zero requests, FileStore under 6 concurrent processes (no lost updates, intact audit chain, one lock winner), fail-closed on held locks, corrupt state and tampered audit, SSRF matrix (URL tricks, metadata endpoints, IPv6 forms, rebinding, redirect targets) | `tests/passport-monitor-security.test.ts` | mocked transport, fake DNS, temp dirs, child processes |

No third-party service is contacted: e2e tests abort every non-local request, and the affiliate
contract is checked by calling the `/go` route handler in-process.

## Changing a baseline on purpose

Baselines change only with an approved change. Regenerate, then review the fixture diff in the PR:

```bash
npm run build && npm run harness:baseline
git diff tests/fixtures
```

`known-broken-links.json` is edited by hand: remove entries when the links are fixed (the test fails
until you do).

## Sensitive values

The fixtures contain the same affiliate IDs that already live in `src/data/partners.ts` and in the
public redirects. They add no new exposure. Never put API keys, passwords or dashboard data here.

## Phase 3A release audit

`e2e/consent-mobile.spec.ts` now covers the homepage, flights, hotels, car rentals and insurance at
375, 390 and 768 CSS pixels. These CI tests block provider requests. They verify first-party
layout and activation only; they do not establish that the provider's own content fits.

The separate opt-in preview harness contacts real providers in fresh Playwright contexts, records
all request URLs/hosts/resource types and console/page errors, and attaches layout screenshots.
It never starts or deploys a server. It accepts only HTTPS `vercel.app` preview domains.

Before running, confirm that the Vercel deployment's Git commit matches the PR head using its
Vercel status and deployment details. `PREVIEW_AUDIT_COMMIT` labels the evidence; it does not
independently verify deployment identity. The preview must be accessible without a sign-in wall.

```bash
PREVIEW_AUDIT_URL=https://YOUR-PREVIEW.vercel.app \
PREVIEW_AUDIT_COMMIT=VERIFIED_FULL_SHA npm run audit:preview
```

Review `preview-audit-report/` and `preview-audit-results/`. Screenshots are evidence for human
layout review, not an automatic visual sign-off. The automatic overflow check measures the outer
page, not every scroll area inside cross-origin widgets. Request assertions recognise documented
optional provider/advertising hosts; review the complete captured host list for new downstream
hosts. Commission credit through a completed booking is outside this harness.

DiscoverCars now uses the iframe URL emitted by its official loader, with the verified affiliate
parameters. This avoids running `widget.js` in the parent page (where the audited `isRTL` error
originated). The iframe retains its own scrollbar and an always-available affiliate link. Provider
scripts inside the iframe are untouched; the observed `gtmgtg` MutationObserver error may remain.
The real-provider search audit reports those errors without suppressing them. Direct-frame search,
mobile sizing, and consent withdrawal must be verified on a new preview before release.
