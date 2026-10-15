/**
 * Phase 4C.3: research proposals for the evidence-review workflow.
 *
 * Everything in this module describes RESEARCH PROPOSALS, never approved records. Nothing here is
 * read by pages, scores, the sitemap or `rules`: published data still comes only from data.ts through
 * the publication gate in verification.ts. A proposal becomes a published record only after a human
 * reviewer approves it in the evidence-review workflow and a reviewed pull request adds it to data.ts.
 *
 * The import rows produced here match the staged Supabase table `passport_evidence_submissions` and the
 * `passport_internal.submit_evidence` RPC (PR #8): ISO alpha-3 codes, an https source URL, a non-null
 * observed_at, a rationale of at least 20 characters and ai_assisted set. Rows carry status "draft".
 * This module never connects to a database.
 */
import { getJurisdiction, jurisdictions } from "./jurisdictions";
import type { AccessCategory, AccessRule, Source, SourceType } from "./types";
import { LEAD_ONLY_DOMAINS } from "./validation";
import { isIsoDate, pairKey, ruleId } from "./verification";

/** Marker carried by every research package and import file. */
export const RESEARCH_PACKAGE_STATUS = "RESEARCH_PROPOSAL_NOT_APPROVED" as const;

/** How much of a source we could actually read on the date checked. */
export type SourceAccess =
  | "read" // the relevant list or statement was read in full
  | "partial" // the page was read but the relevant list was missing, truncated or not country-specific
  | "blocked"; // the page or list could not be read (JavaScript-only, download blocked, placeholder page, error)

export type ResearchSource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  type: SourceType;
  /** ISO 3166-1 alpha-2 of the authority whose rules the source states. */
  authorityJurisdiction: string;
  hostedBy?: string;
  /** Publication or "last updated" date shown by the source itself. Null when the source shows none. */
  publicationDate: string | null;
  /** A date the source carries only in file metadata or its URL (not shown to readers). Never used as publicationDate. */
  metadataDate?: { date: string; from: string } | null;
  /** Date we opened and read the source. */
  checked: string;
  access: SourceAccess;
  /** What we read, what was missing, and anything suspicious. */
  note: string;
  /** Pairs (passport>destination, alpha-2) the source is relevant to. */
  relevantPairs: string[];
};

export type ProposalKind =
  | "new-pair" // the pair has no record in data.ts
  | "corroboration" // a second, independent (or higher-tier) source for an existing record with the same category
  | "re-verification"; // new evidence that disagrees with an existing record

/** Proposals can only ever be pending or disputed. Approval happens in the review workflow, not here. */
export type ProposedVerification = "pending-verification" | "disputed";

export type EvidenceProposal = {
  id: string;
  passport: string;
  destination: string;
  proposedCategory: Exclude<AccessCategory, "unknown">;
  maxStayDays?: number;
  conditions?: string;
  /** Quotation or close paraphrase of what the source says, as read. */
  evidence: string;
  evidenceBasis: "listed" | "absent-from-list" | "group-membership";
  sourceId: string;
  supportingSourceIds?: string[];
  conflictingSourceIds?: string[];
  /** Plain-language description of any disagreement. Required when disputed. */
  conflicts?: string;
  confidence: "high" | "medium";
  kind: ProposalKind;
  proposedVerification: ProposedVerification;
  /** For corroboration / re-verification: the record in data.ts this proposal refers to. */
  existingRecord?: { category: AccessCategory; sourceId: string };
  /** What a reviewer must check before approving. */
  reviewerNotes?: string;
};

export type ResearchPackage = {
  status: typeof RESEARCH_PACKAGE_STATUS;
  phase: "4C.3";
  preparedOn: string;
  sources: ResearchSource[];
  proposals: EvidenceProposal[];
};

/** One row for passport_evidence_submissions, shaped like the submit_evidence RPC parameters. */
export type SubmissionImportRow = {
  research_proposal_id: string;
  research_status: typeof RESEARCH_PACKAGE_STATUS;
  status: "draft";
  rule_id: string;
  passport_code: string;
  destination_code: string;
  proposed_access: Exclude<AccessCategory, "unknown">;
  source_id: string;
  source_url: string;
  source_document_date: string | null;
  observed_at: string;
  rationale: string;
  ai_assisted: true;
  proposed_verification: ProposedVerification;
  confidence: "high" | "medium";
};

const CATEGORIES: Exclude<AccessCategory, "unknown">[] = ["visa-free", "visa-on-arrival", "eta", "evisa", "visa-required", "conditional", "restricted"];
const SOURCE_TYPES: SourceType[] = ["legislation", "government", "official-portal", "embassy"];
const ALPHA3 = /^[A-Z]{3}$/;
const HTTPS = /^https:\/\/[^\s]+$/;

export const alpha3 = (alpha2: string): string => {
  const j = getJurisdiction(alpha2);
  if (!j?.alpha3) throw new Error(`No ISO alpha-3 code for ${alpha2}`);
  return j.alpha3;
};

/** Rationale text for the review queue: states plainly that this is an unapproved proposal. */
const sentence = (s: string) => (/[.!?"”]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

export function rationaleFor(p: EvidenceProposal): string {
  const parts = [
    `Research proposal ${p.id} (${p.kind}, ${p.proposedVerification}, ${p.confidence} confidence). Not approved.`,
    `Evidence: ${sentence(p.evidence)}`,
    p.conditions ? `Conditions: ${sentence(p.conditions)}` : "",
    p.conflicts ? `Conflicts: ${sentence(p.conflicts)}` : "",
    p.existingRecord ? `Existing record: ${p.existingRecord.category} (${p.existingRecord.sourceId}).` : "",
    p.reviewerNotes ? `Reviewer: ${sentence(p.reviewerNotes)}` : "",
  ];
  return parts.filter(Boolean).join(" ");
}

export function toSubmissionRow(p: EvidenceProposal, sources: ResearchSource[] | Source[]): SubmissionImportRow {
  const src = (sources as (ResearchSource | Source)[]).find((s) => s.id === p.sourceId);
  if (!src) throw new Error(`${p.id}: unknown source ${p.sourceId}`);
  const publicationDate = "publicationDate" in src ? src.publicationDate : (src.sourceUpdated ?? null);
  return {
    research_proposal_id: p.id,
    research_status: RESEARCH_PACKAGE_STATUS,
    status: "draft",
    rule_id: ruleId({ passport: p.passport, destination: p.destination, sourceId: p.sourceId }),
    passport_code: alpha3(p.passport),
    destination_code: alpha3(p.destination),
    proposed_access: p.proposedCategory,
    source_id: p.sourceId,
    source_url: src.url,
    source_document_date: publicationDate,
    observed_at: src.checked,
    rationale: rationaleFor(p),
    ai_assisted: true,
    proposed_verification: p.proposedVerification,
    confidence: p.confidence,
  };
}

export const SUBMISSION_CSV_COLUMNS: (keyof SubmissionImportRow)[] = [
  "research_proposal_id",
  "research_status",
  "status",
  "rule_id",
  "passport_code",
  "destination_code",
  "proposed_access",
  "source_id",
  "source_url",
  "source_document_date",
  "observed_at",
  "rationale",
  "ai_assisted",
  "proposed_verification",
  "confidence",
];

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: SubmissionImportRow[]): string {
  return [SUBMISSION_CSV_COLUMNS.join(","), ...rows.map((r) => SUBMISSION_CSV_COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n";
}

/** Import rows for every proposal. validateResearchPackage rejects proposals that cite an unreadable source. */
export function importRows(pkg: ResearchPackage): SubmissionImportRow[] {
  return pkg.proposals.map((p) => toSubmissionRow(p, pkg.sources));
}

/**
 * Checks a research package against the dataset and the staged schema. Returns a list of problems;
 * an empty list means the package is safe to hand to reviewers. It never approves anything.
 */
export function validateResearchPackage(pkg: ResearchPackage, existing: { records: AccessRule[]; sources: Source[] }): string[] {
  const issues: string[] = [];
  if (pkg.status !== RESEARCH_PACKAGE_STATUS) issues.push("package: status marker missing");
  if (!isIsoDate(pkg.preparedOn)) issues.push("package: preparedOn is not an ISO date");

  const allSourceIds = new Set([...existing.sources.map((s) => s.id), ...pkg.sources.map((s) => s.id)]);
  const seenSource = new Set<string>();
  for (const s of pkg.sources) {
    if (seenSource.has(s.id)) issues.push(`${s.id}: duplicate source id`);
    seenSource.add(s.id);
    if (existing.sources.some((e) => e.id === s.id)) issues.push(`${s.id}: id already used by a published source`);
    if (!HTTPS.test(s.url)) issues.push(`${s.id}: url must be https`);
    if (LEAD_ONLY_DOMAINS.test(s.url)) issues.push(`${s.id}: lead-only domain cannot be a source`);
    if (!SOURCE_TYPES.includes(s.type)) issues.push(`${s.id}: unknown source type ${s.type}`);
    if (!getJurisdiction(s.authorityJurisdiction) && s.authorityJurisdiction !== "EU") issues.push(`${s.id}: unknown authority ${s.authorityJurisdiction}`);
    if (!isIsoDate(s.checked)) issues.push(`${s.id}: checked is not an ISO date`);
    else if (s.checked > pkg.preparedOn) issues.push(`${s.id}: checked after the package date`);
    if (s.publicationDate !== null && !isIsoDate(s.publicationDate)) issues.push(`${s.id}: publicationDate is not an ISO date`);
    if (s.publicationDate && s.publicationDate > s.checked) issues.push(`${s.id}: publicationDate after checked`);
    if (s.metadataDate && !isIsoDate(s.metadataDate.date)) issues.push(`${s.id}: metadataDate is not an ISO date`);
    if (!s.note.trim()) issues.push(`${s.id}: note required`);
    for (const k of s.relevantPairs) {
      const [p, d] = k.split(">");
      if (!getJurisdiction(p) || !getJurisdiction(d)) issues.push(`${s.id}: bad relevant pair ${k}`);
    }
  }

  const existingByPair = new Map<string, AccessRule[]>();
  for (const r of existing.records) existingByPair.set(pairKey(r), [...(existingByPair.get(pairKey(r)) ?? []), r]);

  const seenId = new Set<string>();
  const seenRule = new Set<string>();
  for (const p of pkg.proposals) {
    const where = p.id;
    if (seenId.has(p.id)) issues.push(`${where}: duplicate proposal id`);
    seenId.add(p.id);
    const rid = ruleId(p);
    if (seenRule.has(rid)) issues.push(`${where}: duplicate passport/destination/source`);
    seenRule.add(rid);
    if (!getJurisdiction(p.passport)) issues.push(`${where}: unknown passport ${p.passport}`);
    if (!getJurisdiction(p.destination)) issues.push(`${where}: unknown destination ${p.destination}`);
    if (p.passport === p.destination) issues.push(`${where}: passport equals destination`);
    if (!CATEGORIES.includes(p.proposedCategory)) issues.push(`${where}: category ${p.proposedCategory} not allowed`);
    if ((p.proposedVerification as string) === "verified" || !["pending-verification", "disputed"].includes(p.proposedVerification))
      issues.push(`${where}: proposals may only be pending-verification or disputed`);
    if (p.maxStayDays !== undefined && (!Number.isInteger(p.maxStayDays) || p.maxStayDays <= 0)) issues.push(`${where}: bad maxStayDays`);
    if (p.evidence.trim().length < 10) issues.push(`${where}: evidence too short`);

    const src = pkg.sources.find((s) => s.id === p.sourceId);
    if (!src && !existing.sources.some((s) => s.id === p.sourceId)) issues.push(`${where}: unknown source ${p.sourceId}`);
    if (src && src.access === "blocked") issues.push(`${where}: cites a source that could not be read`);
    if (src && src.authorityJurisdiction !== p.destination) issues.push(`${where}: source authority ${src.authorityJurisdiction} is not the destination ${p.destination}`);
    for (const id of [...(p.supportingSourceIds ?? []), ...(p.conflictingSourceIds ?? [])]) if (!allSourceIds.has(id)) issues.push(`${where}: unknown related source ${id}`);

    if (p.proposedVerification === "disputed" && !(p.conflicts?.trim() && (p.conflictingSourceIds?.length ?? 0) > 0))
      issues.push(`${where}: disputed proposals must name the conflict and the conflicting source`);
    if (p.conflictingSourceIds?.length && p.proposedVerification !== "disputed") issues.push(`${where}: conflicting sources listed but not marked disputed`);

    const current = existingByPair.get(`${p.passport}>${p.destination}`) ?? [];
    if (p.kind === "new-pair" && current.length) issues.push(`${where}: marked new-pair but data.ts already has ${current.map(ruleId).join(", ")}`);
    if (p.kind !== "new-pair") {
      const match = current.find((r) => p.existingRecord && r.sourceId === p.existingRecord.sourceId && r.category === p.existingRecord.category);
      if (!match) issues.push(`${where}: existingRecord does not match data.ts`);
      if (p.kind === "corroboration" && p.existingRecord && p.existingRecord.category !== p.proposedCategory) issues.push(`${where}: corroboration must keep the existing category`);
      if (p.kind === "re-verification" && p.proposedVerification !== "disputed") issues.push(`${where}: re-verification must be disputed until reviewed`);
    }

    try {
      const row = toSubmissionRow(p, [...pkg.sources, ...existing.sources] as ResearchSource[]);
      if (!ALPHA3.test(row.passport_code) || !ALPHA3.test(row.destination_code)) issues.push(`${where}: codes must be ISO alpha-3`);
      if (!HTTPS.test(row.source_url)) issues.push(`${where}: source_url must be https`);
      if (row.rationale.trim().length < 20) issues.push(`${where}: rationale shorter than 20 characters`);
      if (!row.observed_at) issues.push(`${where}: observed_at missing`);
    } catch (e) {
      issues.push(`${where}: ${(e as Error).message}`);
    }
  }
  return issues;
}

/** Destinations in a region with no verified record for any sprint passport. */
export function uncoveredDestinations(records: AccessRule[], region: string): string[] {
  const covered = new Set(records.map((r) => r.destination));
  return jurisdictions.filter((j) => j.region === region && !covered.has(j.code)).map((j) => j.code);
}
