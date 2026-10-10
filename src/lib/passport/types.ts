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

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  type: SourceType;
  /** Date the source itself says it was published or updated, if shown. */
  sourceUpdated?: string;
  /** Date we opened and read the source. */
  checked: string;
  /** Caveats about the source, shown to readers. */
  note?: string;
};

export type AccessRule = {
  passport: string;
  destination: string;
  category: AccessCategory;
  maxStayDays?: number;
  conditions?: string;
  /** Short quote or list heading from the source. */
  evidence: string;
  sourceId: string;
  effectiveFrom?: string;
  verification: "verified";
  confidence: "high" | "medium";
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
