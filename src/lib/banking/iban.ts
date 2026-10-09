/**
 * IBAN validation (ISO 13616), run entirely in the visitor's browser.
 *
 * - Country formats and lengths come from `ibantools` (MIT/MPL-2.0), which tracks SWIFT's official
 *   IBAN Registry. Countries flagged IBANRegistry=false are formats used locally but not in the registry.
 * - The MOD-97 checksum is computed here independently, so checksum and length results are reported
 *   separately.
 * - Nothing here stores, logs or transmits the IBAN.
 *
 * A valid IBAN only means it is well formed. It does NOT prove the account exists, who owns it,
 * or that a transfer will succeed.
 */
import { extractIBAN, getCountrySpecifications } from "ibantools";
import { countryName, isCountryCode } from "./iso-countries";

export type IbanCheck = { label: string; ok: boolean | null; detail: string };

export type IbanResult = {
  normalized: string;
  formatted: string;
  country: string | null;
  countryName: string | null;
  inRegistry: boolean;
  expectedLength: number | null;
  valid: boolean;
  checks: IbanCheck[];
  bban: string | null;
  bankIdentifier: string | null;
  branchIdentifier: string | null;
  accountNumber: string | null;
};

const specs = getCountrySpecifications();

export function normalizeIban(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

/** ISO 7064 MOD 97-10 on the rearranged IBAN. Returns true when the remainder is 1. */
export function mod97Valid(iban: string): boolean {
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const v = ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch;
    for (const d of v) rem = (rem * 10 + (d.charCodeAt(0) - 48)) % 97;
  }
  return rem === 1;
}

export function ibanCountryUsage(code: string): { usesIban: boolean; inRegistry: boolean; length: number | null } {
  const s = specs[code.toUpperCase()];
  return { usesIban: Boolean(s?.chars), inRegistry: Boolean(s?.IBANRegistry && s?.chars), length: s?.chars ?? null };
}

export function checkIban(input: string): IbanResult {
  const normalized = normalizeIban(input);
  const formatted = formatIban(normalized);
  const checks: IbanCheck[] = [];
  const base: IbanResult = {
    normalized, formatted, country: null, countryName: null, inRegistry: false, expectedLength: null, valid: false, checks,
    bban: null, bankIdentifier: null, branchIdentifier: null, accountNumber: null,
  };

  if (!normalized) {
    checks.push({ label: "Input", ok: false, detail: "Enter an IBAN." });
    return base;
  }

  const charsOk = /^[A-Z0-9]+$/.test(normalized);
  checks.push({ label: "Characters", ok: charsOk, detail: charsOk ? "Only letters and digits." : "An IBAN can only contain letters A–Z and digits 0–9." });
  if (!charsOk) return base;

  const cc = normalized.slice(0, 2);
  const ccOk = /^[A-Z]{2}$/.test(cc) && isCountryCode(cc);
  const spec = ccOk ? specs[cc] : undefined;
  base.country = ccOk ? cc : null;
  base.countryName = ccOk ? countryName(cc) : null;

  if (!ccOk) {
    checks.push({ label: "Country", ok: false, detail: `An IBAN starts with a two-letter country code. "${cc}" isn't one.` });
    return base;
  }
  if (!spec?.chars) {
    checks.push({ label: "Country", ok: false, detail: `${countryName(cc)} doesn't use IBANs. Use the account number and the bank's SWIFT/BIC code instead.` });
    return base;
  }
  base.inRegistry = Boolean(spec.IBANRegistry);
  base.expectedLength = spec.chars;
  checks.push({
    label: "Country",
    ok: true,
    detail: spec.IBANRegistry ? `${countryName(cc)} uses IBANs (listed in SWIFT's IBAN Registry).` : `${countryName(cc)} uses an IBAN format that isn't in SWIFT's official IBAN Registry. Check with the bank that it's accepted for your payment.`,
  });

  const checkDigitsOk = /^[0-9]{2}$/.test(normalized.slice(2, 4));
  checks.push({ label: "Check digits", ok: checkDigitsOk, detail: checkDigitsOk ? `Characters 3–4 (${normalized.slice(2, 4)}) are digits, as required.` : "Characters 3–4 must be digits." });

  const lengthOk = normalized.length === spec.chars;
  checks.push({ label: "Length", ok: lengthOk, detail: lengthOk ? `${spec.chars} characters, correct for ${countryName(cc)}.` : `${countryName(cc)} IBANs have ${spec.chars} characters. This one has ${normalized.length}.` });

  const bban = normalized.slice(4);
  const bbanOk = lengthOk && spec.bban_regexp ? new RegExp(spec.bban_regexp).test(bban) : lengthOk;
  checks.push({ label: "Country format", ok: lengthOk ? bbanOk : null, detail: !lengthOk ? "Not checked until the length is right." : bbanOk ? "Letters and digits are in the places this country requires." : "Some characters are letters where digits are required, or the other way round." });

  const checksumOk = checkDigitsOk ? mod97Valid(normalized) : false;
  checks.push({ label: "Checksum (MOD-97)", ok: checksumOk, detail: checksumOk ? "The check digits match the rest of the IBAN." : "The check digits don't match. There's probably a typo or two digits swapped." });

  base.valid = charsOk && checkDigitsOk && lengthOk && bbanOk && checksumOk;
  if (base.valid) {
    const ex = extractIBAN(normalized);
    base.bban = ex.bban ?? bban;
    base.bankIdentifier = ex.bankIdentifier ?? null;
    base.branchIdentifier = ex.branchIdentifier ?? null;
    base.accountNumber = ex.accountNumber ?? null;
  }
  return base;
}

/** Rough check used by the universal search box. */
export function looksLikeIban(input: string): boolean {
  const n = normalizeIban(input);
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{8,30}$/.test(n);
}
