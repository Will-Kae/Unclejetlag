# Phase 3C — AdSense content quality and approval readiness

Status: Initial public-site audit, 14 October 2026. **No production changes. No request for AdSense review.**

## Confirmed external blocker
AdSense Sites dashboard (owner screenshot, 14 Oct 2026) lists unclejetlag.com as **Needs attention — Low-value content**; ads.txt is **Authorised**. European regulations message is Published, but the staging CMP delivery remains unverified. These are separate workstreams.

## Public pages reviewed
- / — editorial landing page, updates, affiliate and destination navigation
- /destinations — five full country guides (Canada, Georgia, South Africa, UAE, UK); remaining country entries labelled research list
- /visas — four passport-to-destination briefs currently highlighted
- /guides and /updates — some short (1-minute) updates; short news is not inherently low value, but needs original context and official sourcing
- /passport-index — incomplete global coverage disclosed; rankings held until verification threshold
- /editorial-policy, /corrections-policy, /about, /authors/uncle-jetlag — editorial transparency present
- /insurance — country insurance claims need ongoing official-source review

## Risk-ranked work queue
P0: Inventory every indexable route; identify thin/placeholder/demo pages, duplicate metadata, broken links and affiliate-first pages. Keep unverified entry-rule content out of search indexing. Do not blanket-noindex useful completed guides.
P0: Audit visa, entry, insurance and regulatory claims against current primary sources; preserve source URL, date checked, effective date and jurisdiction; correct or qualify uncertain statements.
P1: Deepen five existing country guides with actionable first-party editorial detail: entry by passport, arrival transport, real-world payments, data, typical costs, safety, and practical itinerary; never invent first-hand experience or price quotes.
P1: Review all affiliate comparison pages for methodology, non-affiliate alternatives, pros/cons, eligibility and prominent disclosures.
P1: Audit the user journey, mobile layout, search navigation, internal links, 404s, accessibility, sitemap, robots and canonical metadata.
P2: Maintain a changelog, correction trail and periodic re-verification of high-risk travel claims; measure search impressions and engagement before review.

## Review acceptance criteria
- Every indexed page has a distinct, helpful purpose and substantial verified value.
- No placeholders presented as complete guides; uncertain information is clearly labelled.
- Official references, review dates and clear authorship visible where material.
- Monetized pages remain helpful without clicking a booking or affiliate link.
- No material broken routes or misleading claims.
- Manual AdSense re-review requested only after remediation and owner approval.

## Safety and branch policy
This branch was created from `main` for documentation and remediation only. Do not merge, deploy to production, activate ad slots or change Phase 3B CMP release flags. CMP verification remains blocked separately.
