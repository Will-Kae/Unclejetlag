# Passport data audit: 12 November 2026

Dataset `2026.10-s2` (asOf 2026-10-10) → `2026.11-u1` (asOf 2026-11-12). Methodology unchanged (0.1).
Process: `uj-official-update-2026-11-12` (founder-requested, AI-assisted by Claude, one researcher, no second reviewer).
Review reference: branch `passport/2026-11-12-saudi-evisa`.

## Applied

### Saudi Arabia: tourist eVisa permitted countries

Source added: `sa-evisa-terms`, Saudi eVisa terms and conditions, https://visa.visitsaudi.com/Home/TermsConditions
(official portal, Ministry of Tourism). Opened and read in a browser on 2026-11-12 (automated requests get HTTP 403).

| Record id | Before | After |
|---|---|---|
| `MX-SA-sa-evisa-terms` | no record (not yet verified) | evisa, verified, high |
| `BA-SA-sa-evisa-terms` | no record (not yet verified) | evisa, verified, high |
| `RS-SA-sa-evisa-terms` | no record (not yet verified) | evisa, verified, high |
| `MK-SA-sa-evisa-terms` | no record (not yet verified) | evisa, verified, high |

Evidence: Bosnia and Herzegovina, Serbia, Mexico and North Macedonia appear in the "Permitted Countries" list.
Conditions recorded from clause 7: valid one year from issue; multiple entries unless the eVisa states otherwise;
maximum stay 3 months.

Notes:
- The request said a maximum stay of 90 days. The source says "3 months", so `maxStayDays` is left unset and
  "3 months" is kept in the conditions rather than converted.
- No effective date is shown on the source, so `effectiveFrom` is unset and the source `checked` date
  (2026-11-12) is the verification date. `sourceUpdated` is unset.
- Visa on arrival is not recorded: not checked against an official Saudi source.
- No `policyChanges` entry: the previous state of these pairs was never verified, so there is no "before" to state.

Guard tests updated for this approved change (640 → 644 published records; new review reference and process
accepted) in `tests/passport-provenance.test.ts`, `tests/passport-monitor.test.ts`,
`tests/passport-evidence-research.test.ts` and `tests/passport-review-workspace.test.ts`. Baselines regenerated with
`UPDATE_BASELINE=1` (`tests/fixtures/passport-index-snapshot.json`, `reports/passport-coverage.json`); only the four
passports above and the dataset totals changed.

## Not applied (flagged for review)

### Kazakhstan: QazETA

Sources read and consistent:
https://memleket.kz/en/news/130728-reference-information-on-the-procedure-for-obtaining-an-electronic-entry-authorization-for-the-republic-of-kazakhstan
and https://memleket.kz/en/news/125892-on-the-electronic-entry-permit-to-the-republic-of-kazakhstan
(Resolution No. 890 of 10 October 2026; free; 180 days; apply up to 72 hours ahead; recommended 1 Nov 2026 to
30 Jun 2027; mandatory from 1 Jul 2027; stay periods unchanged).
Blocked: the dataset has no Kazakhstan-destination records, and the notices do not list the visa-free
nationalities, which must not be inferred. The model also has no field for an authorisation layered on a
visa-free record.

### British Virgin Islands: conditional eVisa exemption

Source read: https://gov.vg/print/pdf/node/3590 (bulletin released 11 November 2026; scheduled 15 November 2026,
subject to the Visa Exemption Order).
Blocked: the British Virgin Islands is not in the jurisdiction registry, there are no visa-restricted passport →
BVI records, and the model cannot hold a pending conditional overlay.
