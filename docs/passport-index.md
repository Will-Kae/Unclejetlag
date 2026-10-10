# Uncle Jetlag World Passport Index

How Far Can Your Passport Take You? · Search. Compare. Discover. Explore.

Status: **Phase A, free, monetisation off.** Methodology v0.1 (draft). Worldwide ranking **not published**.

## Phase A (shipped)

| Route | What it does |
|---|---|
| `/passport-index` | Hub: passport picker, dataset status, Africa sprint coverage, latest changes |
| `/passport-index/passports` | All 199 passports by region with verified counts |
| `/passport-index/passports/[country]` | Profile: breakdown, verified destinations with sources, regional table. `noindex` until it has verified data |
| `/passport-index/compare` | Two-passport comparison (`?a=ZW&b=ZA`) with three access filters; unverified pairs kept apart |
| `/passport-index/rankings` | Publication gate and coverage progress (alphabetical, not a ranking) |
| `/passport-index/africa` | 15-passport matrix, AU regions |
| `/passport-index/changes` | Verified policy changes only |
| `/passport-index/methodology`, `/data-sources`, `/faq` | Documentation |

Code: `src/lib/passport/` (registry, data, engine, methodology), `src/components/passport/`, `tests/passport.test.ts`.

## Not built yet (and why)

| Spec item | Blocker |
|---|---|
| Interactive map | Pointless while ~80% of each map would be grey. Build once a passport passes ~50% coverage. MapLibre + Natural Earth (public domain) |
| Other regional pages, history | No scored passports, no snapshots. Never fabricate history |
| Database, admin, API, pipelines | Phase B. `data.ts` mirrors the spec tables (`sources` ≈ data_sources, `rules` ≈ visa_access_rules + evidence) for a mechanical import |

## Data rules (hard)

1. Evidence only from the destination government, its embassies, official e-visa/ETA portals, or legislation.
2. Never copy another index, Wikipedia, Timatic, or visa agencies. Use them only to locate official pages.
3. Every rule cites a registered source; tests enforce this and block third-party domains.
4. Unknown is not zero. No score below 95% passport coverage; no ranking until 90% of passports are scored.
5. Regional membership (SADC, EAC, ECOWAS, AU) is never evidence of visa-free entry.
6. Conflicting official sources → hold for review. Never pick the favourable answer.
7. Re-verify every 180 days; update `checked` only after actually reading the source.

## Research method

Work destination-first: one official list (e.g. South Africa's exemption list, the EU Annex I, the UK visa
national list) settles that destination for every passport at once. Sprint 1 passports: ZA ZW BW NA ZM MW MZ
LS SZ KE TZ UG RW NG GH.

Sprint 2 (10 Oct 2026) added Zambia, Zimbabwe, Kenya, Rwanda, Uganda, Botswana, Tanzania, Seychelles and part of
Namibia as destinations, read in the browser on official sites. Still unverified: Ghana (MFA list only reported in
the press), Namibia (other passports), Mozambique, Malawi, Lesotho, Eswatini, Nigeria, Mauritius.

Known gaps: many African immigration portals are JavaScript-only or blocked from automated readers; these need
manual reading. EU Annex I is cited from the 2018 adopted text; re-read the consolidated text when accessible.

## Licensing register

| Source | Status |
|---|---|
| Government websites / legislation | Facts, cited and linked; no bulk copying of page text |
| IATA Timatic | Commercial licence; not used. Ask IATA for terms before any decision |
| Wikipedia visa pages | CC BY-SA; share-alike would bind a compiled database. Not used |

## Phase B

Postgres (Supabase) tables per the spec, admin review queue with roles, read-only API `/api/v1/*` with rate
limits, scheduled source-change checks, ranking snapshots, map, history. Monetisation review only after
coverage and licensing are settled.
