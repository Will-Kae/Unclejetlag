# Uncle Jetlag Global Banking

Find Banks. Verify Codes. Move Globally.

Status: **Phase A live. Free. Monetisation off.** Review monetisation on **7 January 2027**, and not before
the data-licensing questions below are settled.

## What ships in Phase A

| Route | What it does |
|---|---|
| `/tools/global-banking` | Landing page: universal search, SWIFT/BIC checker, IBAN validator, countries |
| `/tools/swift-code-checker` | ISO 9362 structure check + decode + directory match |
| `/tools/iban-validator` | Country, length, BBAN format, MOD-97 (ISO 7064) |
| `/tools/bank-directory` | All directory records, grouped by country, with search |
| `/tools/bank-code-finder` | 301 → `/tools/bank-directory` |
| `/banks/[country]` | 15 priority countries: receiving money, domestic identifiers, verified codes |
| `/banks/[country]/[bank]` | Only real directory records. No invented branches, addresses or routing numbers |
| `/banks` | 301 → `/tools/global-banking#countries` |

Code: `src/lib/banking/` (engines and data), `src/components/banking/` (UI), `tests/` (`npm test`).

## Result statuses

- **Invalid format**: breaks ISO 9362 / ISO 13616.
- **Valid format · not in our directory** (`unverified`): structure is correct; we make no claim about owner or activity.
- **Found in our directory** (`directory-match`): matches a record with a source URL and check date.
- **Possibly inactive** (`potentially-inactive`): reserved for records whose source marks them inactive.

Never say a code is "active" or that an IBAN proves an account exists or who owns it.

## Privacy rules

- All checks run in the browser. IBANs are never sent, stored, logged, put in URLs or sent to analytics.
- If a server API is added (Phase B), IBAN requests must be POST-only, excluded from request logging, and
  never persisted.

## Data rules (hard)

1. **Allowed sources only:** the bank's own website, or an official central-bank / regulator publication.
2. **Never copy third-party directories.** Wise (terms §8.2(c)), SWIFT's free BIC search, theswiftcodes.com,
   bank.codes and similar forbid copying or redistribution. Linking to SWIFT's official search is fine.
3. Every identifier stores: source URL, source title, source type, date checked, and publication year if old.
4. Sources published more than ~2 years ago are shown with a "confirm with the bank" warning.
5. No fictional or placeholder records. If a bank doesn't publish its code, it isn't listed.
6. Recheck every record at least every 6 months; update `checked` dates only after actually opening the source.

## Expanding coverage legitimately

| Source | What it gives | Licence position |
|---|---|---|
| SWIFT **SWIFTRef BIC Directory** | Every BIC, branch, status | Paid licence; redistribution terms must be negotiated. Required for full coverage |
| SWIFT **IBAN Registry** | IBAN formats per country | Free to download; already used via the `ibantools` library (MIT/MPL-2.0) |
| Central-bank registers (e.g. SARB, Bank of England, Bundesbank BLZ file, ECB) | Licensed institutions, sometimes BICs and domestic codes | Check each publication's reuse terms before importing |
| Bank websites | Individual codes | Facts, cited and linked; add one at a time |

Steps before any bulk import: confirm the licence in writing, record it in `data_sources`, keep the source
file and import date, and show the source on every page that uses it.

## Phase B roadmap (not built)

- **Database:** Postgres (Supabase) with `institutions`, `identifiers`, `data_sources`, `change_log`.
  `src/lib/banking/directory.ts` already uses this shape so the import is mechanical.
- **Admin:** authenticated editor to add/retire records, attach sources, and flag stale entries.
- **Public API:** read-only `/api/bic/:code` and POST `/api/iban/validate`; rate limiting per IP and key;
  no IBAN logging.
- **Analytics:** count tool usage and match rates only, never the codes or IBANs entered.
- **Monetisation:** off until the 7 January 2027 review, and only if data licensing allows it.
