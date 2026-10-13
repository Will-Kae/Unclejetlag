# Consent and third-party services (Phase 3A)

How Uncle Jetlag decides what third-party code a visitor's browser may load.

## Two separate permissions

| Permission | How the visitor gives it | Stored | What it allows |
|---|---|---|---|
| **Advertising consent** | Cookie banner: "Accept all", or "Customise" with Advertising ticked | `uj_consent` cookie (`ads: true`), 6 months | Travelpayouts Drive, the CJ impression pixel, Google ads storage (Consent Mode), and automatic loading of the embedded tools |
| **Tool activation** | The tool's own **Load …** button | In memory only, for the current visit (survives client-side navigation, not a reload) | That one tool, nothing else |

**A tool activation never grants advertising consent:**

- Pressing "Load flight search" loads the Travelpayouts flight widget.
- It does not load Drive, the CJ pixel or any other tool.
- It does not write the consent cookie.

`mayLoadAdvertising()` in `src/lib/consent/services.ts` doesn't take an activation as input at all. A unit test enforces this.

## Inventory

| Service | Hosts | Component | Loads |
|---|---|---|---|
| Travelpayouts flight search | `tpwidg.com` | `TravelpayoutsFlightsWidget` | Ads consent or the "Load flight search" button |
| Expedia stays search | `creator.expediagroup.com` (inside the same-origin `/embeds/expedia-stays.html`) | `ExpediaWidget` | Ads consent or the "Load hotel and stays search" button |
| DiscoverCars car hire search | `widget.discovercars.com` | `DiscoverCarsWidget` | Ads consent or the "Load car hire search" button (a plain affiliate link is offered meanwhile) |
| Genki health insurance calculator | `widgets.genki.world` | `TravelInsuranceSection` | Ads consent or the "Load health insurance calculator" button |
| Travelpayouts Drive | `emrldtp.cc` | `ThirdPartyScripts` | Ads consent only |
| CJ impression pixel (World Nomads) | `www.lduhtrp.net` | `CjImpressionPixel` | Ads consent only |
| Google Analytics | `googletagmanager.com` | `ThirdPartyScripts` | Analytics consent only (and only if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set) |
| Google AdSense | `pagead2.googlesyndication.com` | `layout.tsx` | Only if `NEXT_PUBLIC_ADSENSE_CLIENT` is set. It runs under Consent Mode defaults of "denied". Not changed in Phase 3A; see "Open points". |

**Not third-party loads:** affiliate links (`/go/*`, the CJ click link, Genki product links) load nothing until clicked, and then the visitor leaves the site.

## Travelpayouts Drive and site verification

- **The snippet stays in the server-rendered `<head>`** exactly as issued, so Travelpayouts' ownership check can still find it. It's marked `type="text/plain"`, which browsers never execute, plus `data-consent-category="advertising"`.
- **The script runs only after advertising consent:** `ThirdPartyScripts` then injects the same `TRAVELPAYOUTS_DRIVE_SRC`.
- **Travelpayouts' published guidance** (["How to confirm that you own a website"](https://support.travelpayouts.com/hc/en-us/articles/26411796684818-How-to-confirm-that-you-own-a-website)) offers only a `<head>` code snippet for verification. No meta-tag, file or DNS alternative is documented. It doesn't say whether the code must stay installed afterwards.
- **Neither that page nor the [Drive FAQ](https://support.travelpayouts.com/hc/en-us/articles/32097258847378-FAQ-about-Drive)** mentions cookie consent, CMPs or conditional loading.
- **Drive reads page content and rewrites links into affiliate links,** so it's treated as advertising/tracking.
- **Open question for Travelpayouts support:** is an inert snippet plus consent-gated loading acceptable for verification and attribution? Unconditional loading must not be restored to satisfy verification.

## Withdrawal

- **When a visitor changes advertising from on to off,** `ConsentProvider.save()` reloads the page. Scripts that already ran (Drive, loaded tools) can't be unloaded, so the reload starts the page again in the denied state.
- **Changing only analytics consent** doesn't reload.
- **Cookies a provider already set remain** until they expire or the visitor deletes them; the cookie policy says so.

## Tests

| File | What it checks |
|---|---|
| `e2e/consent.spec.ts` | Every third-party request is recorded and aborted across 12 page types, with all booking tabs opened and every lazy section scrolled into view, for: no choice made; "Essential only" (including client-side navigation); a single tool activation; "Accept all"; withdrawal (reload, then nothing); an analytics-only change (no reload). |
| `e2e/widgets.spec.ts` | Each tool, loaded the way a visitor would load it, still carries its exact affiliate identifiers |
| `tests/consent-services.test.ts` | The gate truth tables; activation never stands in for advertising consent; the issued URLs and parameters are unchanged |

Partner hosts are never contacted in tests. Live behaviour of the tools after loading is checked manually on a Vercel preview (see the Phase 3A deployment plan).
