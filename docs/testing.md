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
| Partner integrations: Travelpayouts site script + flights widget params, Expedia embed IDs, DiscoverCars attributes, Genki iframe + links, World Nomads CJ link, CJ pixel consent gating, Impact verification, booking tabs, hub partner links | `e2e/widgets.spec.ts` | values in the spec |
| Country identifiers: destination registry, Passport Index jurisdictions, banking ISO set and guides, bank slugs, eSIM slugs, region keys, content files | `tests/data-consistency.test.ts` | `tests/fixtures/registry-snapshot.json` |
| Visa briefs agree with the Passport Index; every rule cites a registered source | `tests/data-consistency.test.ts` | — |
| Accessibility: axe-core WCAG 2.0/2.1/2.2 A+AA on 13 representative pages + result states, desktop and mobile; cookie banner; skip link; visible focus on the first 30 tab stops | `e2e/accessibility.spec.ts` | zero violations |
| Colour tokens: Passport Index category colours >= 4.5:1 with white; text tokens >= 4.5:1 on white and paper; focus ring >= 3:1 | `tests/accessibility-tokens.test.ts` | values in `globals.css` / `src/lib/passport/types.ts` |

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
