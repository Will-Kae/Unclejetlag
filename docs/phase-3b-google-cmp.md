# Phase 3B — Google-certified CMP and AdSense integration

## Current state (not launched)

- Google AdSense publisher ID: `ca-pub-6434910360613331` (the `ca-` prefix is used for the client ID).
- AdSense is still hard-disabled by `ADSENSE_RELEASE_ENABLED = false` in `src/components/monetization/ads-config.ts`.
- The site owner explicitly confirmed the Google Privacy & messaging European regulations message is **Draft**. It has not been published; live TCF behavior cannot yet be verified.
- Existing `CookieBanner` and `ConsentProvider` handle first-party affiliate/analytics choices; Travelpayouts flight analytics has its own explicit permission.
- The existing first-party `uj_consent.ads` preference **must not** be treated as IAB TCF consent or proof of permission to serve Google ads.

## Integration plan / release gates

1. **CMP provisioning:** Confirm the Google-certified message's vendor list, geographic scope, privacy disclosures, and the published message's TCF behavior. Publishing the Google message is a separate user-authorized dashboard action.
2. **Load mechanism:** Confirm the actual Google-supported CMP loader for the AdSense account, rather than inventing a CMP script URL. AdSense's publisher tag may trigger Google's Privacy & messaging message; loading it prematurely could create advertising network requests.
3. **Avoid competing banners:** Keep Uncle Jetlag's banner for non-Google preferences only where appropriate; ensure Google's certified CMP is the authoritative source for Google advertising consent for covered regions. Never equate `uj_consent.ads` with `__tcfapi` / a TCF consent string.
4. **Consent Mode v2:** Denied defaults must precede Google tags; align subsequent signals with CMP-approved states, including `ad_storage`, `ad_user_data`, `ad_personalization`, and `analytics_storage`. Do not grant based solely on legacy `uj_consent.ads`.
5. **AdSense gating:** Keep `ADSENSE_RELEASE_ENABLED` false until certified CMP behavior is verified, the Google tag integration is reviewed, and the user authorizes launch. Validate `ads.txt` separately.
6. **Regression testing:** Test EEA/UK/Switzerland and non-EEA visitors; first visit, accept, reject, manage, reopen/withdraw; no duplicate banners; no premature Google ad calls; Travelpayouts flight permission remains independent; mobile 375/390 px and desktop; privacy/cookie policies match actual behavior.
7. **Deployment:** PR review and preview audit before explicit approval to merge or enable ads.

## Current limitation

The publisher ID alone does not connect or publish the certified CMP. No assertion of a working CMP integration should be made until the Google dashboard message is published and its behavior is verified on a controlled preview.

## Verified Google documentation and safe preview sequence (October 2026)

Official references:
- https://developers.google.com/funding-choices/fc-api-docs
- https://support.google.com/adsense/answer/10961068
- https://support.google.com/adsense/answer/17341119

1. Google's Privacy & messaging API documents that **the published message is normally delivered by the AdSense tag**. There is no independent CMP-only loader established for this integration. Do not invent one.
2. Google explicitly says **the message must be published** for the `?fc=alwaysshow&fctype=gdpr` debugging URL to display it. A draft cannot be end-to-end tested this way.
3. The account-level **Maximize message coverage** option can cause a fallback message to appear through the AdSense tag even if the customized message is still a draft. This setting may affect all AdSense-tagged sites in the account.
4. The supported `googlefc.callbackQueue` key `CONSENT_API_READY` signals TCF API availability, **not that a user has consented**. The revocation control can use `__tcfapi('addEventListener', 0, ...)` and `gdprApplies` as in Google's documented example. Never use `CONSENT_API_READY` as an ad-consent grant.
5. Google's CMP can update Google Consent Mode advertising and analytics purposes if configured in its dashboard. Before enabling this, review overlap with Uncle Jetlag's first-party GA4 analytics consent: do not let one integration unexpectedly override the other's preferences.
6. Safe local tests before any account-wide publishing: run the existing unit tests and Playwright ad-blocking tests on the preview; verify no `adsbygoogle.js` is present after both Essential only and Accept all; confirm the footer and independent flight-search analytics controls. **These do not constitute a live Google CMP test.**
7. A live CMP test requires an explicit coordinated release plan because publishing the message affects the registered production domain and loading the AdSense tag can cause requests. Arrange a controlled deployment and verify EEA/UK/Swiss consent, reject, manage, revocation, mobile, and requests. Keep `ADSENSE_RELEASE_ENABLED = false` until this plan is approved and executed.

**Release gate:** Do not merge or publish from this document alone. Account-wide dashboard changes and production ad activation require explicit owner authorization.

## Verification checkpoint

- Publisher tag is decoupled from affiliate cookie; `ADSENSE_RELEASE_ENABLED` and `ADSENSE_CMP_VERIFIED` remain false.
- Ad slots remain independently disabled by `ADSENSE_SLOTS_ENABLED = false`.
- CI passing does not verify a published Google CMP. Before launch test real TCF state, Consent Mode, withdrawal and network calls for covered regions.

## Owner-confirmed CMP status (13 October 2026)

- **Draft**, explicitly confirmed by the owner. Do not publish as part of this development phase.
- Run CI, typecheck/build, static and browser consent tests with AdSense and slots disabled.
- A Google CMP `?fc=alwaysshow&fctype=gdpr` test is **not a valid end-to-end acceptance test while the message remains Draft**.
- After code checks pass, request separate approval for a coordinated CMP publication and controlled live verification. No deployment or AdSense enablement is implied.
