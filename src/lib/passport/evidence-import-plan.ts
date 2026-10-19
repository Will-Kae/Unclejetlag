/**
 * Offline Phase 4C.3 draft-import boundary.
 *
 * Produces a human-reviewable plan only. This module deliberately has no
 * database client, network calls, or write capability.
 */
import type { AccessRule, Source } from "./types";
import {
  RESEARCH_PACKAGE_STATUS,
  importRows,
  validateResearchPackage,
  type ResearchPackage,
  type SubmissionImportRow,
} from "./evidence-research";

export type DraftSubmissionFields = Pick<SubmissionImportRow,
  "rule_id" | "passport_code" | "destination_code" | "proposed_access" |
  "source_id" | "source_url" | "source_document_date" | "observed_at" |
  "rationale" | "ai_assisted"
>;

export type DraftImportPlan = {
  status: "DRY_RUN_ONLY";
  total: number;
  disputed: number;
  pendingVerification: number;
  rows: ReadonlyArray<Readonly<DraftSubmissionFields>>;
  issues: string[];
};

/** Explicit whitelist: research metadata never becomes an unverified table column. */
export function draftFields(row: SubmissionImportRow): DraftSubmissionFields {
  return {
    rule_id: row.rule_id,
    passport_code: row.passport_code,
    destination_code: row.destination_code,
    proposed_access: row.proposed_access,
    source_id: row.source_id,
    source_url: row.source_url,
    source_document_date: row.source_document_date,
    observed_at: row.observed_at,
    rationale: row.rationale,
    ai_assisted: row.ai_assisted,
  };
}

/**
 * Fail closed on any invalid proposal. No output row implies permission to
 * write: a later authenticated RPC must establish its own role and policy gates.
 */
export function planDraftImport(
  pkg: ResearchPackage,
  existing: { records: AccessRule[]; sources: Source[] },
): DraftImportPlan {
  const issues = validateResearchPackage(pkg, existing);
  if (pkg.status !== RESEARCH_PACKAGE_STATUS) issues.push("import: package not marked as unapproved research");
  if (pkg.proposals.length !== 28) issues.push("import: expected 28 research proposals");
  for (const source of pkg.sources) {
    if (source.access !== "read" && pkg.proposals.some(p => p.sourceId === source.id))
      issues.push(`import: proposal cites unreadable or partial source ${source.id}`);
  }
  const disputed = pkg.proposals.filter(p => p.proposedVerification === "disputed").length;
  const pendingVerification = pkg.proposals.filter(p => p.proposedVerification === "pending-verification").length;
  if (disputed !== 4) issues.push("import: expected 4 disputed proposals");
  if (issues.length) return { status: "DRY_RUN_ONLY", total: pkg.proposals.length, disputed, pendingVerification, rows: [], issues };
  return {
    status: "DRY_RUN_ONLY",
    total: pkg.proposals.length,
    disputed,
    pendingVerification,
    rows: importRows(pkg).map(draftFields),
    issues: [],
  };
}
