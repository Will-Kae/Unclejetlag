# Phase 3B — Google-certified CMP and AdSense integration

## Current state (not launched)

- Google AdSense publisher ID: `ca-pub-6434910360613331` (the `ca-` prefix is used for the client ID).
- AdSense is still hard-disabled by `ADSENSE_RELEASE_ENABLED = false` in `src/components/monetization/ads-config.ts`.
- Google's Privacy & messaging European regulations message for `unclejetlag.com` is saved as a **draft**, not published.
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
