# Consent and third-party services (Phase 3A)

How Uncle Jetlag decides what third-party code a visitor's browser may load.

## Three separate permissions

| Permission | How the visitor gives it | Stored | What it allows |
|---|---|---|---|
| **Advertising consent** | Cookie banner: "Accept all", or "Customise" with Advertising ticked | `uj_consent` cookie (`ads: true`), 6 months | Travelpayouts Drive, the CJ impression pixel, Google ads storage (Consent Mode), and automatic loading of the embedded tools |
| **Tool activation** | The tool's own **Load …** button (hotels, car hire, Genki) | In memory only, for the current visit (survives client-side navigation, not a reload) | That one tool, nothing else |
| **Flight search analytics** | **Allow and load flight search** on the flight search, or the "Flight search analytics" box in Cookie settings | `uj_flight_analytics` cookie (`{v:1,ts,granted}`), 6 months; `granted:false` records a decline | The Travelpayouts flight search and the analytics it starts. Nothing else. Not part of "Accept all" |

**A tool activation never grants advertising consent:**

- Pressing "Load hotel and stays search" loads the Expedia widget.
- It does not load Drive, the CJ pixel or any other tool.
- It does not write the consent cookie.

`mayLoadAdvertising()` in `src/lib/consent/services.ts` doesn't take an activation as input at all. A unit test enforces this.

## Why the flight search has its own permission

- **Loading the Travelpayouts flight search starts Travelpayouts' behavioural analytics.** On the PR #9 preview (13 October 2026), with "Essential only" and only the flight search loaded, the browser contacted `tpwidg.com`, `avsplow.com` (Snowplow collector), `sentry.avs.io`, `img.wway.io` and `www.apistp.com`, and `_sp_id.<hex>` (unique ID + visit timestamps, 13 months) and `_sp_ses.<hex>` (30 minutes) appeared on our domain.
- **Drive does not set them:** with advertising consent and no flight search, only `am_user_session` appeared.
- **No documented way to switch the analytics off:** the Travelpayouts help article for the flight search form lists project, SubID, form type, language, currency, hosts, colours and default cities, and no analytics, cookie or consent option. So a generic click-to-load press is not treated as consent; the visitor sees what the analytics does and chooses Allow or No thanks.
- **Unbundled:** "Accept all" never sets `uj_flight_analytics`, and allowing it never writes `uj_consent` (so it doesn't answer the banner). `mayLoadFlightSearch()` takes neither advertising consent nor an activation as input.
- **Equal choice:** "Allow and load flight search" and "No thanks" are both full buttons. A decline is remembered and shows a short "Flight search not loaded" note with "Review this choice".

## Inventory

| Service | Hosts | Component | Loads |
|---|---|---|---|
| Travelpayouts flight search | `tpwidg.com`, then `avsplow.com`, `sentry.avs.io`, `img.wway.io`, `www.apistp.com` | `TravelpayoutsFlightsWidget` inside `FlightSearchConsent` | Flight search analytics permission only |
| Expedia stays search | `creator.expediagroup.com` (inside the same-origin `/embeds/expedia-stays.html`) | `ExpediaWidget` | Ads consent or the "Load hotel and stays search" button |
| DiscoverCars car hire search | `widget.discovercars.com` | `DiscoverCarsWidget` | Ads consent or the "Load car hire search" button (a plain affiliate link is offered meanwhile) |
| Genki health insurance calculator | `widgets.genki.world` | `TravelInsuranceSection` | Ads consent or the "Load health insurance calculator" button |
| Travelpayouts Drive | `emrldtp.cc` | `ThirdPartyScripts` | Ads consent only |
| CJ impression pixel (World Nomads) | `www.lduhtrp.net` | `CjImpressionPixel` | Ads consent only |
| Google Analytics | `googletagmanager.com` | `ThirdPartyScripts` | Analytics consent only (and only if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set) |
| Google AdSense | `pagead2.googlesyndication.com` | `ThirdPartyScripts`, `AdSlot` | **Off for this release** in every consent state: `ADSENSE_RELEASE_ENABLED = false` in `src/components/monetization/ads-config.ts`, even if `NEXT_PUBLIC_ADSENSE_CLIENT` is set. Re-enable together with a Google-certified CMP (Phase 3B); it then loads only after advertising consent. Tests: `e2e/adsense-off.spec.ts`, `tests/consent-services.test.ts`. |

**Not third-party loads:** affiliate links (`/go/*`, the CJ click link, Genki product links) load nothing until clicked, and then the visitor leaves the site.

## Travelpayouts Drive and site verification

- **The snippet stays in the server-rendered `<head>`** exactly as issued, so Travelpayouts' ownership check can still find it. It's marked `type="text/plain"`, which browsers never execute, plus `data-consent-category="advertising"`.
- **The script runs only after advertising consent:** `ThirdPartyScripts` then injects the same `TRAVELPAYOUTS_DRIVE_SRC`.
- **Travelpayouts' published guidance** (["How to confirm that you own a website"](https://support.travelpayouts.com/hc/en-us/articles/26411796684818-How-to-confirm-that-you-own-a-website)) offers only a `<head>` code snippet for verification. No meta-tag, file or DNS alternative is documented. It doesn't say whether the code must stay installed afterwards.
- **Neither that page nor the [Drive FAQ](https://support.travelpayouts.com/hc/en-us/articles/32097258847378-FAQ-about-Drive)** mentions cookie consent, CMPs or conditional loading.
- **Drive reads page content and rewrites links into affiliate links,** so it's treated as advertising/tracking.
- **Open question for Travelpayouts support:** is an inert snippet plus consent-gated loading acceptable for verification and attribution? Unconditional loading must not be restored to satisfy verification.

## Withdrawal

- **When a visitor changes advertising, or the flight search analytics, from on to off,** `ConsentProvider` reloads the page. The flight search can be turned off with "Turn off" under it, in Cookie settings, or with "Essential only". Scripts that already ran (Drive, loaded tools) can't be unloaded, so the reload starts the page again in the denied state.
- **Changing only analytics consent** doesn't reload.
- **Tracking cookies on our own domain are deleted whenever their permission is missing:** on withdrawal and on every page load (`clearUnpermittedTrackingCookies` in `src/lib/consent/tracking-cookies.ts`). `_sp_id`/`_sp_ses` need the flight search analytics permission; `am_user_session` needs advertising consent. These were observed on 13 October 2026, all with path `/`:

  | Cookie | Set by | Domain | Secure | Lifetime |
  |---|---|---|---|---|
  | `_sp_id.<4 hex>` | Snowplow tracker loaded by the Travelpayouts flight search | `unclejetlag.com` (Domain cookie); on previews, the full host | yes | 13 months |
  | `_sp_ses.<4 hex>` | Snowplow tracker loaded by the Travelpayouts flight search | same as `_sp_id` | yes | 30 minutes |
  | `am_user_session` | Travelpayouts Drive | host-only | no | 30 minutes |

  - The 4-hex suffix differs per site (`.43e4` in production, `.4e6c` on the preview).
  - Each cookie is expired host-only and for every parent domain, then cleared again by the next page load's sweep, because a tracker can rewrite its cookie while the page unloads.
  - Only these patterns are touched; `uj_consent`, authentication and security cookies are never deleted.
- **Cookies a provider set on its own domain** stay until they expire or the visitor deletes them; the cookie policy says so.

## Tests

| File | What it checks |
|---|---|
| `e2e/consent.spec.ts` | Every third-party request is recorded and aborted across 12 page types, with all booking tabs opened and every lazy section scrolled into view, for: no choice made; "Essential only" (including client-side navigation); a single tool activation; "Accept all"; withdrawal (reload, then nothing); an analytics-only change (no reload). |
| `e2e/widgets.spec.ts` | Each tool, loaded the way a visitor would load it, still carries its exact affiliate identifiers |
| `e2e/consent-flight-analytics.spec.ts` | The flight search: disclosure and equal choice; refusal (nothing loads, no cookie, remembered); "Accept all" doesn't allow it; acceptance (only `tpwidg.com`, no ads consent, persists across reloads); allowing before the banner leaves it unanswered; withdrawal by "Turn off", Cookie settings and "Essential only" (reload, `_sp_*` deleted, nothing loads afterwards) |
| `tests/consent-tracking-cookies.test.ts`, `e2e/consent-cookies-domain.spec.ts`, the last test in `e2e/consent.spec.ts` | Withdrawal deletes the three tracking cookies (host-only and `Domain=` forms, including a rewrite during unload) and keeps `uj_consent` and other cookies; scripts stay blocked afterwards |
| `tests/consent-services.test.ts` | The gate truth tables; activation never stands in for advertising consent; the issued URLs and parameters are unchanged |

Partner hosts are never contacted in tests. Live behaviour of the tools after loading is checked manually on a Vercel preview (see the Phase 3A deployment plan).
