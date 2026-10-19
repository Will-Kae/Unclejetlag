/**
 * Typed mirror of Phase-4C6-Evidence-Resolution-Plan.md ("Priority investigations" table).
 * tests/passport-review-workspace.test.ts checks every field against the Markdown table, so the plan
 * stays the single source of truth. `passport`/`destination` are added here to link cases; null passport
 * means a destination-wide topic rather than one passport–destination pair.
 */
export type ResolutionPlanEntry = {
  id: string;
  priority: "P0" | "P1" | "P2";
  case: string;
  passport: string | null;
  destination: string;
  currentPosition: string;
  evidenceNeeded: string;
  releaseGate: string;
};

/** Date stated at the top of the plan. */
export const RESOLUTION_PLAN_DATE = "2026-10-19";

export const resolutionPlan: ResolutionPlanEntry[] = [
  {"id": "plan-gh-tz", "priority": "P0", "case": "Ghana ordinary passport → Tanzania", "passport": "GH", "destination": "TZ", "currentPosition": "Existing visa-free classification remains unchanged but flagged for re-verification; Tanzania 2026 guidelines contradict themselves between §6 and §7", "evidenceNeeded": "Dated written clarification from Tanzania Immigration Services Department that explicitly names Ghana, passport class, and entry category", "releaseGate": "Reviewer resolves contradiction with primary-source evidence"},
  {"id": "plan-zw-tz", "priority": "P0", "case": "Zimbabwe ordinary passport → Tanzania", "passport": "ZW", "destination": "TZ", "currentPosition": "Unverified; do not import disputed proposal", "evidenceNeeded": "Current dated Tanzanian immigration notice or written departmental confirmation naming Zimbabwe", "releaseGate": "Reviewer approves a consistent official source"},
  {"id": "plan-ng-tz", "priority": "P0", "case": "Nigeria ordinary passport → Tanzania", "passport": "NG", "destination": "TZ", "currentPosition": "Unverified; do not infer from Commonwealth membership alone", "evidenceNeeded": "Clarification reconciling 2026 guidelines §6 and §7", "releaseGate": "No automated approval"},
  {"id": "plan-sz-na", "priority": "P0", "case": "Eswatini ordinary passport → Namibia", "passport": "SZ", "destination": "NA", "currentPosition": "Unverified; embassy exemption lists differ", "evidenceNeeded": "Current Namibian ministry ordinary-passport exemption/VOA schedule", "releaseGate": "Reviewer validates passport type"},
  {"id": "plan-gh-na", "priority": "P1", "case": "Ghana ordinary passport → Namibia", "passport": "GH", "destination": "NA", "currentPosition": "Existing visa-on-arrival record unchanged, with fact-sheet caveat", "evidenceNeeded": "Ministry-hosted current VOA list or written ministry confirmation", "releaseGate": "Verify ordinary versus diplomatic passport"},
  {"id": "plan-tz-insurance", "priority": "P1", "case": "Tanzania inbound travel insurance", "passport": null, "destination": "TZ", "currentPosition": "Mandatory scheme evidenced; start date, resident/citizen exemptions and Zanzibar overlap unresolved", "evidenceNeeded": "Official Gazette Notice No. 256/2026 and NIC terms; effective date and exceptions quoted exactly", "releaseGate": "No unsupported start-date or exemption claims in destination copy"},
  {"id": "plan-mw-visa-fee", "priority": "P1", "case": "Malawi single-entry visa fee", "passport": null, "destination": "MW", "currentPosition": "Immigration department lists USD 75 online; embassies list USD 50", "evidenceNeeded": "Current official fee schedule specifying online vs consular charges and effective dates", "releaseGate": "Distinguish channels; do not silently choose one amount"},
  {"id": "plan-gh-african-entry-policy", "priority": "P2", "case": "Ghana entry policy for African passports", "passport": null, "destination": "GH", "currentPosition": "Announcement alone does not prove visa-free entry without eVisa/eTA", "evidenceNeeded": "GIS eligibility result and published legal instrument", "releaseGate": "Per-passport verification before import"},
  {"id": "plan-mw-exemption-list", "priority": "P2", "case": "Malawi visa-exemption list", "passport": null, "destination": "MW", "currentPosition": "Unverified for many African passports", "evidenceNeeded": "Official dated exemption schedule, including ordinary-passport scope", "releaseGate": "Per-passport verification before import"},
];
