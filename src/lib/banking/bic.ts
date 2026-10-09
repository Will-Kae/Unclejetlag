/**
 * SWIFT/BIC parsing and validation (ISO 9362).
 *
 * Structure: 4-character institution code + 2-letter ISO country code + 2-character location code
 * + optional 3-character branch code. Pure functions, no network: safe to run in the browser.
 *
 * A valid FORMAT never means the code is assigned, active, connected to SWIFT, or able to receive
 * payments. Only a match against a sourced directory record says anything about the institution.
 */
import { countryName, isCountryCode } from "./iso-countries";
import { findByBic, type BicMatch } from "./directory";

export type BicIssue = { level: "error" | "warning" | "info"; message: string };

export type BicParts = {
  institution: string;
  country: string;
  countryName: string;
  location: string;
  branch: string | null;
};

/**
 * invalid          – breaks ISO 9362 structure
 * directory-match  – matches a sourced record in our directory
 * unverified       – structure is valid, but no record in our directory
 * potentially-inactive – a source we hold says the code is historic/inactive
 */
export type BicStatus = "invalid" | "directory-match" | "unverified" | "potentially-inactive";

export type BicResult = {
  input: string;
  normalized: string;
  formatValid: boolean;
  status: BicStatus;
  parts: BicParts | null;
  issues: BicIssue[];
  match: BicMatch | null;
};

export function normalizeBic(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function parseBic(input: string): { normalized: string; parts: BicParts | null; issues: BicIssue[] } {
  const normalized = normalizeBic(input);
  const issues: BicIssue[] = [];

  if (input.trim() !== input.trim().toUpperCase() || /\s/.test(input.trim())) {
    issues.push({ level: "info", message: "We removed spaces and converted the code to capital letters. BICs are always written in capitals with no spaces." });
  }
  if (normalized.length === 0) return { normalized, parts: null, issues: [{ level: "error", message: "Enter a SWIFT/BIC code." }] };
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    issues.push({ level: "error", message: "A BIC can only contain letters A–Z and digits 0–9." });
    return { normalized, parts: null, issues };
  }
  if (normalized.length !== 8 && normalized.length !== 11) {
    issues.push({ level: "error", message: `A BIC has 8 or 11 characters. This one has ${normalized.length}.` });
    return { normalized, parts: null, issues };
  }

  const institution = normalized.slice(0, 4);
  const country = normalized.slice(4, 6);
  const location = normalized.slice(6, 8);
  const branch = normalized.length === 11 ? normalized.slice(8, 11) : null;

  if (!/^[A-Z]{2}$/.test(country)) {
    issues.push({ level: "error", message: `Characters 5–6 must be a two-letter country code. "${country}" contains a digit.` });
  } else if (!isCountryCode(country)) {
    issues.push({ level: "error", message: `"${country}" isn't an ISO country code, so this can't be a valid BIC.` });
  }
  if (/[0-9]/.test(institution)) {
    issues.push({ level: "info", message: "The institution code contains digits. That's allowed under the current standard (ISO 9362:2014) but uncommon, so double-check it." });
  }
  if (location[1] === "0") {
    issues.push({ level: "warning", message: "The 8th character is 0, which marks a test and training BIC. These aren't used for real payments." });
  } else if (location[1] === "1") {
    issues.push({ level: "info", message: "The 8th character is 1, which marks a passive participant: an institution reached through another bank rather than directly on the SWIFT network." });
  }
  if (branch) {
    if (branch === "XXX") {
      issues.push({ level: "info", message: `XXX means the head office, so ${normalized} is the same as ${normalized.slice(0, 8)}.` });
    } else if (branch.startsWith("X")) {
      issues.push({ level: "error", message: `Branch codes starting with X are reserved: only XXX (head office) is allowed. "${branch}" isn't valid.` });
    }
  }

  const hasError = issues.some((i) => i.level === "error");
  const parts: BicParts = { institution, country, countryName: isCountryCode(country) ? countryName(country) : country, location, branch };
  return { normalized, parts: hasError ? null : parts, issues };
}

export function checkBic(input: string): BicResult {
  const { normalized, parts, issues } = parseBic(input);
  if (!parts) return { input, normalized, formatValid: false, status: "invalid", parts: null, issues, match: null };

  const match = findByBic(normalized);
  let status: BicStatus = "unverified";
  if (match) status = match.identifier.status === "inactive" ? "potentially-inactive" : "directory-match";
  if (match?.level === "institution" && parts.branch && parts.branch !== "XXX") {
    issues.push({ level: "info", message: `We hold the head-office code ${normalized.slice(0, 8)} for this bank, but not branch ${parts.branch}. Confirm the branch code with the bank.` });
  }
  return { input, normalized, formatValid: true, status, parts, issues, match };
}

/** Rough check used by the universal search box to decide which tool to route to. */
export function looksLikeBic(input: string): boolean {
  const n = normalizeBic(input);
  return /^[A-Z0-9]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(n);
}
