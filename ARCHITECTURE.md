# Uncle Jetlag — Architecture

This document is the blueprint: information architecture, component architecture,
content model and design system. Read it before adding features.

---

## 1. Information architecture

```
/                                   Home
/destinations                       Destination hub (8 regions)
/destinations/region/[region]       Region listing (africa, europe, asia, middle-east, …)
/destinations/[country]             Country guide (e.g. /destinations/georgia)
/visas                              Visa & passport hub + passport→destination finder
/visas/[passport]                   Everything we cover for one passport (e.g. /visas/zimbabwe)
/visas/[passport]/[destination]     Passport × destination brief (e.g. /visas/zimbabwe/georgia)
/visas/guides/[slug]                Visa explainers (editorial)
/money                              Money Abroad hub
/money/topics/[topic]               Subcategory (banking-abroad, travel-cards, …)
/money/[slug]                       Money article
/travel-tech                        Travel Tech hub
/travel-tech/topics/[topic]         Subcategory (esims, travel-apps, vpns, …)
/travel-tech/[slug]                 Travel-tech article
/guides                             Jetlag Guides hub
/guides/topics/[topic]              Subcategory (travel-planning, flights, airports, …)
/guides/[slug]                      Guide article
/search?q=                          Search results
/authors/[slug]                     Author profile (e.g. /authors/uncle-jetlag)
/about  /contact                    Company
/privacy /cookies /terms            Legal
/editorial-policy /affiliate-disclosure /corrections-policy
/go/[partner]                       Affiliate redirect (noindex, rel=sponsored)
/api/newsletter                     Newsletter subscribe endpoint (provider adapter)
/search-index.json                  Static search index (built at compile time)
/og                                 Dynamic OpenGraph image generator
/sitemap.xml /robots.txt /manifest.webmanifest
```

**Why category-prefixed article URLs?** `/money/visa-vs-mastercard-abroad` tells Google
and readers the topical cluster; hubs link down, articles link up (breadcrumbs) and
sideways (related articles by shared tags/category). All URL building lives in
`src/lib/routes.ts` — never hand-write article URLs in components.

**Reserved for future features** (do not create slugs that collide):
`/account`, `/saved`, `/trip-planner`, `/tools/*` (visa checker, currency converter,
budget calculator, eSIM comparison, country comparison), `/alerts`, `/api/v1/*`.

## 2. Component architecture

```
src/components/
  layout/     Header (sticky, mega-menu), MobileNav, Footer, SkipLink, Logo
  search/     SearchDialog (⌘K overlay), SearchResults (page), search engine in lib/search.ts
  cards/      ArticleCard (3 variants), CountryCard, TopicCard
  article/    ArticleHeader, TableOfContents, ReadingProgress, ShareBar, AuthorBox,
              RelatedArticles, FaqSection, SourcesList, Breadcrumbs, UpdatedBadge
  mdx/        Components available inside Markdown/MDX:
              Callout (info|warning|tip|verify), ComparisonTable, ProsCons,
              PickCard ("Uncle Jetlag Pick"), AffiliateButton, AffiliateDisclosure,
              Placeholder (demo-content marker), KeyFacts, AdSlot
  monetization/ AdSlot, AdSenseScript, AffiliateDisclosure
  consent/    ConsentProvider + CookieBanner + Google Consent Mode v2 defaults
  newsletter/ NewsletterForm (inline | card | footer variants)
  ui/         Container, Section, Button, Badge, Pill, CoverArt, JsonLd
```

Server components by default. Client components only where interaction requires it:
Header menus, SearchDialog, search page, ReadingProgress, ShareBar (copy link),
CookieBanner, NewsletterForm, VisaFinder. Everything else ships zero JS.

## 3. Content model

Content lives in `/content` as Markdown/MDX with YAML frontmatter, validated by Zod
schemas in `src/lib/content/schema.ts`. **The build fails on invalid content** — that is
deliberate. All reads go through `src/lib/content/index.ts` (the *content source*). To
move to a headless CMS (Sanity, Contentful, Payload, Storyblok…), reimplement that one
module against the CMS API and keep the same return types; pages don't change.

```
content/
  articles/*.mdx       Editorial articles (money, travel-tech, guides, visas)
  destinations/*.mdx   Country guides (structured quick-facts + MDX body)
  visas/*.mdx          Passport × destination briefs  (file: {passport}--{destination}.mdx)
  pages/*.mdx          Legal & policy pages
src/data/
  countries.ts         Country registry (slug, ISO-2, region, aliases) — used by
                       destinations hub, visa finder, search, future tools
  authors.ts           Author profiles
  taxonomy.ts          Sections + subtopics
  partners.ts          Affiliate partner registry (→ /go/[partner])
  site.ts              Site-wide config (name, URL, socials, nav)
```

### Article frontmatter

| field | type | notes |
|---|---|---|
| title | string | H1 |
| slug | string | URL segment; must match filename |
| description | string | dek + default meta description |
| category | `money \| travel-tech \| guides \| visas` | decides URL prefix |
| subcategory | string | must exist in taxonomy |
| author | string | author slug |
| publishedDate / updatedDate | `YYYY-MM-DD` | updatedDate drives freshness badges |
| featuredImage | `{ src?, alt, credit? }` | no `src` → generative CoverArt |
| tags | string[] | used for related content + search |
| seoTitle / seoDescription | string? | override `<title>` / meta |
| faqs | `{ q, a }[]` | renders FAQ section + FAQPage JSON-LD |
| sources | `{ title, url, publisher? }[]` | References list |
| status | `published \| draft` | drafts excluded from build output |
| contentStatus | `verified \| demo` | `demo` shows a visible placeholder banner |
| hasAffiliateLinks | boolean | shows disclosure at top |
| featured / trending | boolean | homepage placement |

Destinations add: `country` (registry slug), `region`, `capital`, `currency {code,name}`,
`languages`, `timezone`, `plugTypes`, `voltage`, `drivingSide`, `emergency`,
`airports[]`, `bestTime`, `dailyBudget`. Visa briefs add: `passport`, `destination`,
`requirement`, `visaType`, `allowedStay`, `applicationMethod`, `fees`, `processingTime`,
`documents[]`, `officialResources[]`, `verifiedDate`.

## 4. Design system

**Idea:** a boarding pass designed by a magazine. Editorial serif headlines, a crisp
grotesque for reading, and monospaced "flight-data" labels for facts.

| token | value | use |
|---|---|---|
| `ink` | `#0E1A24` | text, dark surfaces |
| `paper` | `#FAF7F2` | page background (warm off-white) |
| `sand` | `#EFE8DC` | secondary surfaces |
| `jet` (brand orange) | `#F2542D` | primary actions, highlights |
| `sky` | `#1F6FEB`-ish deep blue `#1C4E80` | links, info |
| `palm` | `#1E7A5F` | success / "verified" |
| `amber` | `#B7791F` | warnings / "verify" |

Type: **Fraunces** (display, optical-size serif with personality) · **Inter** (UI + body)
· **JetBrains Mono** (labels, codes like `TBS`, `GEL`, dates). Loaded via `next/font`
(self-hosted, no layout shift).

Scale: fluid `clamp()` headings; body 18px/1.7 on articles; 65–72ch measure.
Radius 14–20px on cards; hairline borders (`ink/10`) instead of heavy shadows.
Motion: 150–300ms ease-out, `prefers-reduced-motion` respected.

Signature elements: dashed perforation dividers, IATA-style mono chips
(`TBS · GEL · UTC+4`), "Last updated" stamps, generative cover art per country
(gradient + latitude lines + ISO code) until real photography is supplied.

## 5. Monetization architecture

- **Ads:** `<AdSlot position>` renders nothing until `NEXT_PUBLIC_ADSENSE_CLIENT` is set
  *and* the visitor granted advertising consent. Positions: `after-intro`, `mid-article`
  (auto-inserted by a remark plugin at the middle H2), `end-of-article`, `sidebar`.
  Set `NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS=true` to preview slot positions.
- **Affiliates:** outbound partner links go through `/go/[partner]` so links can be
  changed centrally; all use `rel="sponsored nofollow noopener"`. Articles with
  `hasAffiliateLinks: true` show a disclosure above the fold.
- **Consent:** Google Consent Mode v2 defaults to *denied*; the banner updates it.
  For EEA/UK/Swiss traffic Google requires a Google-certified CMP (TCF v2.2) for AdSense —
  swap `CookieBanner` for one before enabling ads in those regions.

## 6. Future-proofing notes

- Country registry keyed by ISO-2 → visa checker, passport discovery, currency converter
  and comparisons all join on it.
- Search index is a plain JSON contract (`SearchDoc`) — swap for Algolia/Typesense/
  Meilisearch without touching UI.
- Newsletter uses a provider adapter (`src/lib/newsletter.ts`).
- No auth yet; add Auth.js/Clerk under `/account` + a DB for saved destinations.
- All data-heavy tools should live under `/tools/*` as client islands.
