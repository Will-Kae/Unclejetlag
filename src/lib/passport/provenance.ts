/**
 * Source provenance (Phase 2A): a complete, traceable record for every rule, built from the rule, its
 * source and the change ledger below. Nothing here is guessed: fields the evidence does not give
 * (a source's own update date, an independent reviewer) stay null and are reported as gaps.
 */
import { jName } from "./jurisdictions";
import { currentMethodology, type MethodologyVersion } from "./methodology";
import { SOURCE_TIER, type AccessCategory, type AccessRule, type AuthorityTier, type EvidenceBasis, type RuleRevision, type Source, type VerificationStatus } from "./types";
import { effectiveStatus, reviewDueOn, ruleId } from "./verification";

/** How a record was verified. Referenced by rule revisions. */
export const verificationProcesses: Record<string, { label: string; description: string; independentReview: boolean }> = {
  "uj-research-sprint-1": {
    label: "Research sprint 1 (10 Oct 2026)",
    description:
      "Destination-first reading of official lists (South Africa, EU Annex I, UK, Ireland, US, Canada) plus two individual visa briefs (Georgia, UAE). AI-assisted research by Claude for the founder: the official page was opened and read, and a short quote or list heading was recorded as evidence. One researcher; no second reviewer.",
    independentReview: false,
  },
  "uj-research-sprint-2": {
    label: "Research sprint 2 (10 Oct 2026)",
    description:
      "African destinations (Zambia, Zimbabwe, Kenya, Rwanda, Uganda, Botswana, Tanzania, Seychelles, part of Namibia), read in the browser on official sites by the same AI-assisted process. One researcher; no second reviewer.",
    independentReview: false,
  },
};

/**
 * Change ledger at source level. Every rule citing a source was created in the commit that added the
 * source (checked against git: sprint 2 only added lines to data.ts). Per-rule revisions after Phase 2A
 * are appended to `ruleRevisions`.
 */
export const sourceLedger: Record<string, { addedIn: string; addedOn: string; process: keyof typeof verificationProcesses }> = Object.fromEntries([
  ...["za-dirco-exempt", "eu-2018-1806", "gb-visa-nationals", "ie-visa-list", "us-vwp", "us-suspension-2026", "ca-entry", "ge-visa-permit-list", "ge-evisa", "ae-gdrfa-tourist"].map((id) => [id, { addedIn: "5860cd4", addedOn: "2026-10-10", process: "uj-research-sprint-1" }]),
  ...["zm-no-visa", "zm-voa", "zm-prior", "zw-cat-a", "zw-cat-b", "zw-cat-c", "ke-eta-exempt", "rw-visa-general", "ug-exempt", "bw-embassy-us", "tz-hc-namibia", "na-mha-2025", "sc-ics"].map((id) => [id, { addedIn: "15e3c1b", addedOn: "2026-10-10", process: "uj-research-sprint-2" }]),
]);

/** Revisions recorded after creation, keyed by rule id. Empty at Phase 2A: no rule has changed since it was created. */
export const ruleRevisions: Record<string, RuleRevision[]> = {};

export type RuleRecord = {
  id: string;
  passport: string;
  passportName: string;
  destination: string;
  destinationName: string;
  category: AccessCategory;
  source: {
    id: string;
    url: string;
    title: string;
    issuingAuthority: string;
    authorityJurisdiction: string | null;
    hostedBy: string | null;
    tier: AuthorityTier;
    type: Source["type"];
  };
  additionalSourceIds: string[];
  evidence: string;
  evidenceBasis: EvidenceBasis;
  dateChecked: string;
  /** null when the source shows no publication or update date. Never inferred. */
  sourceUpdated: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  storedStatus: VerificationStatus;
  status: VerificationStatus;
  confidence: AccessRule["confidence"];
  reviewDueOn: string;
  conditions: string | null;
  maxStayDays: number | null;
  /** Verification process identifier; the reviewer is the process (no named independent reviewer yet). */
  process: string;
  independentReview: boolean;
  revisions: RuleRevision[];
};

export function toRuleRecord(rule: AccessRule, source: Source, asOf: string, m: MethodologyVersion = currentMethodology): RuleRecord {
  const id = ruleId(rule);
  const ledger = sourceLedger[source.id];
  const created: RuleRevision | undefined = ledger && { revision: 1, date: ledger.addedOn, action: "created", status: "verified", process: ledger.process, ref: ledger.addedIn };
  const revisions = [...(created ? [created] : []), ...(ruleRevisions[id] ?? [])];
  const process = revisions.at(-1)?.process ?? "unrecorded";
  return {
    id,
    passport: rule.passport,
    passportName: jName(rule.passport),
    destination: rule.destination,
    destinationName: jName(rule.destination),
    category: rule.category,
    source: {
      id: source.id,
      url: source.url,
      title: source.title,
      issuingAuthority: source.publisher,
      authorityJurisdiction: source.authorityJurisdiction ?? null,
      hostedBy: source.hostedBy ?? null,
      tier: SOURCE_TIER[source.type],
      type: source.type,
    },
    additionalSourceIds: rule.additionalSourceIds ?? [],
    evidence: rule.evidence,
    evidenceBasis: rule.evidenceBasis ?? "listed",
    dateChecked: source.checked,
    sourceUpdated: source.sourceUpdated ?? null,
    effectiveFrom: rule.effectiveFrom ?? null,
    effectiveTo: rule.effectiveTo ?? null,
    storedStatus: rule.verification,
    status: effectiveStatus(rule, source, asOf, m),
    confidence: rule.confidence,
    reviewDueOn: reviewDueOn(source, m),
    conditions: rule.conditions ?? null,
    maxStayDays: rule.maxStayDays ?? null,
    process,
    independentReview: verificationProcesses[process]?.independentReview ?? false,
    revisions,
  };
}
