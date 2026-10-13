# Phase 3A release-audit fix

Based on PR #9 head `8c6b5c12deb480d230c68c615e7eae516557f763`.

## Implementation

- Replace the DiscoverCars parent-page `widget.js?v1` loader with the same provider iframe URL
  observed during the successful Johannesburg search audit. This removes execution of the loader
  that emitted the `isRTL` error in the parent page.
- Keep `aff_code=a_aid`, `aff_value=unclejetlag`, UTM parameters and `widget_origin`. Affiliate
  fallback routes and their frozen contract are unchanged.
- Give the iframe the accessible title at creation. Preserve consent gating and near-viewport
  loading. Keep an affiliate link available if the iframe fails. Retain inner scrolling so fixed
  frame height does not hide provider controls.
- Cover homepage, flights, hotels, car rentals and insurance at 375, 390 and 768px in CI.
- Test first-hop activation isolation independently for all four embedded services.
- Add an opt-in real-provider preview audit with isolated contexts, network/event capture,
  console stacks, screenshots, consent withdrawal and Johannesburg search/redirect checks.

## Local validation

- Production build: PASS.
- Typecheck: PASS.
- Unit/data/affiliate tests: 272 passed; four baseline writers intentionally skipped.
- Browser preservation tests: 86 passed; one baseline writer intentionally skipped.
- Preview harness discovery: 23 tests loaded successfully; not executed against a deployment.

Local browser tests abort provider requests. They prove the site's gate, URL contract, controls
and outer layout; they do not prove provider content behaviour or commission credit.

## Before release

Run the preview harness against a new deployment whose commit has been confirmed. Inspect live
iframe dimensions at each width and repeat search-to-results attribution. The direct-frame
endpoint was previously observed working, but this revised parent integration has not been live
preview tested. Its URL is provider-controlled and may change.

The provider's internal `gtmgtg` MutationObserver error is not changed or suppressed here. The
live audit records it as a failing finding if it persists. Resolve with DiscoverCars or explicitly
assess it after a successful live search; do not claim it is fixed from local tests.

No merge, production changes, deployment or remote push performed for this fix.
