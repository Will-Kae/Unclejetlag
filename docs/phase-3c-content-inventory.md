# Phase 3C — Repository content inventory and first-pass risk register

Date: 2026-10-14. Source: `main` Git tree and selected source files. This is a **repository inventory**, not a live crawler or exhaustive editorial verification.

## Inventory
| Source | Count | Notes |
|---|---:|---|
| `content/articles/*.mdx` | 29 | Mix of practical guides, finance/visa articles and short dated updates |
| `content/destinations/*.mdx` | 40 | **Not** equivalent to 40 fully verified or indexed guides; statuses must be inspected |
| `content/visas/*.mdx` | 4 | Passport-specific briefs; high-risk travel information |
| `content/pages/*.mdx` | 6 | Policy/disclosure pages |
| `src/app/**/page.tsx` | 55 | Route templates including dynamic routes, not total generated pages |

## Confirmed implementation strengths
- Destination page metadata applies `noindex: !isIndexable(d)`; sitemap includes only indexable destination/visa/article content.
- Destination pages display author, dates, sources, content status and affiliate disclosure through `ArticleShell`.
- Georgia guide is substantial (~13.6 KB MDX) with transport, payments, budget, entry and source sections.
- Australia guide has official Australian immigration and biosecurity source links.
- Two-weeks-in-Georgia budget article has a multi-category price comparison and source list.

## First-pass issues requiring verification
| ID | Priority | Page/source | Observation | Action |
|---|---|---|---|---|
| CQ-01 | P0 | `src/app/sitemap.ts` | Hubs are unconditionally listed, including passport rankings/changes and tools. Some may have incomplete data despite valid templates. | Inspect each hub for substantive utility and consider noindex for incomplete hubs after editorial review. |
| CQ-02 | P0 | `content/destinations/georgia.mdx` | Mandatory insurance and visa exemption details are specific, date-sensitive legal claims; insurance reference includes a commercial insurer. | Verify against current Georgian government primary sources, document checked date, qualify as needed. |
| CQ-03 | P0 | `content/articles/two-weeks-in-georgia-cost.mdx` | FAQ budget says US$460–700 and US$950–1,550; table totals are US$460–720 and US$965–1,560. | Reconcile ranges consistently and label all prices as estimates, not guarantees. |
| CQ-04 | P1 | `content/destinations/australia.mdx` | FAQ generalises ETA/eVisitor eligibility and says “Everyone except New Zealanders needs one”; nationality/visa class details can vary. | Replace broad phrasing with passport-dependent eligibility and link official Home Affairs guidance. |
| CQ-05 | P1 | `content/destinations/*.mdx` | 40 country MDX records exist but not all are full verified guides. | Generate status-by-status inventory and check noindex behavior on unverified pages. |
| CQ-06 | P1 | `content/articles/*.mdx` | 29 articles span guides and regulatory news, some time-sensitive. | Audit dated claims, sources, unique value, duplication and update dates. |
| CQ-07 | P1 | affiliate/insurance/eSIM/tools routes | Monetization-related templates are plentiful; editorial-to-promotion balance is not yet assessed. | Audit each page's unique value, comparison methodology and disclosures. |

## Remediation sequence
1. Complete 40-destination status audit and 29-article quality matrix (readability, originality, official sourcing, update recency).
2. Verify Georgia entry/insurance and Australia ETA guidance with primary sources.
3. Correct budget inconsistency CQ-03 in development only, with test.
4. Inspect passport index and tools hubs for empty/placeholder experiences; preserve existing noindex guards.
5. Run route-level link, sitemap and accessibility tests; collect evidence before asking for AdSense review.

## Release safeguards
Phase 3C branch only. No production merge/deploy, no AdSense review submission, no ad-slot activation, and no changes to Phase 3B CMP gates.
