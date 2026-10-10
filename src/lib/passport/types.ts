export type AccessCategory =
  | "visa-free"
  | "visa-on-arrival"
  | "eta"
  | "evisa"
  | "visa-required"
  | "conditional"
  | "restricted"
  | "unknown";

/**
 * Category colours carry white 12px label text, so every colour must reach WCAG 2.2 AA 4.5:1 against
 * white (checked by tests/accessibility-tokens.test.ts). Shape/short codes back up colour for meaning.
 */
export const categoryMeta: Record<AccessCategory, { label: string; short: string; colour: string; noAdvanceVisa: boolean }> = {
  "visa-free": { label: "Visa-free", short: "VF", colour: "#15803d", noAdvanceVisa: true },
  "visa-on-arrival": { label: "Visa on arrival", short: "VOA", colour: "#2563eb", noAdvanceVisa: true },
  eta: { label: "Electronic travel authorisation", short: "ETA", colour: "#0f766e", noAdvanceVisa: true },
  evisa: { label: "eVisa", short: "eV", colour: "#a16207", noAdvanceVisa: false },
  "visa-required": { label: "Visa required", short: "VR", colour: "#c2410c", noAdvanceVisa: false },
  conditional: { label: "Conditional", short: "C", colour: "#7c3aed", noAdvanceVisa: false },
  restricted: { label: "Entry restricted", short: "R", colour: "#7f1d1d", noAdvanceVisa: false },
  unknown: { label: "Not yet verified", short: "?", colour: "#6b7280", noAdvanceVisa: false },
};

export type SourceType = "legislation" | "government" | "official-portal" | "embassy";

/**
 * Source priority (lower is stronger). Only tiers 1–3 may be cited as evidence for a verified rule.
 * Commercial indexes, IATA Timatic, visa agencies, encyclopedias and the press are leads only:
 * they may point us to an official page but are never stored as a `Source`.
 * See docs/passport-data-provenance.md, "Source priority".
 */
export type AuthorityTier = 1 | 2 | 3;
export const SOURCE_TIER: Record<SourceType, AuthorityTier> = {
  legislation: 1,
  government: 2,
  "official-portal": 2,
  embassy: 3,
};

export type Source = {
  id: string;
  title: string;
  /** Issuing authority or publisher named on the source. */
  publisher: string;
  url: string;
  type: SourceType;
  /** Jurisdiction whose rules the source states (normally the destination). */
  authorityJurisdiction?: string;
  /** Set when the document is hosted by someone other than its issuing authority. */
  hostedBy?: string;
  /** Date the source itself says it was published or updated, if shown. Never inferred. */
  sourceUpdated?: string;
  /** Date we opened and read the source. A reachable URL alone never updates this. */
  checked: string;
  /** Caveats about the source, shown to readers. */
  note?: string;
};

/**
 * Review lifecycle (Phase 2A):
 * discovered → pending-verification → verified → review-due → superseded | rejected, plus disputed for
 * conflicting evidence. Only verified (and review-due, which is computed from the check date) records
 * can be published. See src/lib/passport/verification.ts.
 */
export type VerificationStatus = "discovered" | "pending-verification" | "verified" | "review-due" | "disputed" | "superseded" | "rejected";

/**
 * How the evidence supports the rule.
 * - "listed": the source names the passport (or its group) with this treatment.
 * - "absent-from-list": the source is an exhaustive list of exemptions, and the passport is not on it,
 *   so the default treatment (normally visa required) applies. Weaker than "listed"; flagged in reports.
 */
export type EvidenceBasis = "listed" | "absent-from-list";

export type AccessRule = {
  passport: string;
  destination: string;
  category: AccessCategory;
  maxStayDays?: number;
  conditions?: string;
  /** Short quote or list heading from the source. */
  evidence: string;
  /** Defaults to "listed" when absent. */
  evidenceBasis?: EvidenceBasis;
  sourceId: string;
  /** Further sources for the conditions or limitations (not for the category itself). */
  additionalSourceIds?: string[];
  effectiveFrom?: string;
  /** Last day the rule applies, when the source states one or a later rule replaces it. */
  effectiveTo?: string;
  verification: VerificationStatus;
  confidence: "high" | "medium";
  /** Rule ids this rule deliberately takes precedence over (e.g. a temporary suspension). Not a conflict. */
  overrides?: string[];
  /** Set on a superseded rule: the id of the rule that replaced it. */
  supersededBy?: string;
};

/** One entry in a rule's revision history. */
export type RuleRevision = {
  revision: number;
  /** Date the record changed (not the date the source was read; that is Source.checked). */
  date: string;
  action: "created" | "re-verified" | "amended" | "status-changed";
  status: VerificationStatus;
  /** Verification process identifier (see verificationProcesses in provenance.ts). */
  process: string;
  /** Git commit or review reference where the change was made. */
  ref: string;
  note?: string;
};

export type PolicyChange = {
  id: string;
  headline: string;
  passports: string[];
  destination: string;
  previous: string;
  next: string;
  effective: string;
  sourceId: string;
  verified: string;
};
