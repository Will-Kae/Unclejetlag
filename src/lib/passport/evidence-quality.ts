/**
 * Phase 4C.4: offline, read-only quality assessment.
 * This module does not import database clients or expose mutation operations.
 * Quality findings are advisory; they never approve evidence or publish rules.
 */
import type { AccessRule, Source } from "./types";
import { planDraftImport } from "./evidence-import-plan";
import type { ResearchPackage } from "./evidence-research";

export type QualityFinding = {
  proposalId: string;
  severity: "blocker" | "review";
  code: "DISPUTED" | "SOURCE_UNREADABLE" | "SOURCE_MISSING" | "CONFLICTING_SOURCE" | "MISSING_REVIEW_NOTES" | "UNSUPPORTED_BASIS";
  message: string;
};

export type EvidenceQualityReport = {
  status: "RESEARCH_ONLY_NOT_APPROVED";
  proposalCount: number;
  blockedCount: number;
  disputedCount: number;
  findings: QualityFinding[];
  importPlanValid: boolean;
  importIssues: string[];
};

/** Preserve the explicit human-review gate even if the import plan is otherwise valid. */
export function assessEvidenceQuality(
  pkg: ResearchPackage,
  existing: { records: AccessRule[]; sources: Source[] },
): EvidenceQualityReport {
  const plan = planDraftImport(pkg, existing);
  const findings: QualityFinding[] = [];
  for (const proposal of pkg.proposals) {
    const add = (severity: QualityFinding["severity"], code: QualityFinding["code"], message: string) =>
      findings.push({ proposalId: proposal.id, severity, code, message });
    const source = pkg.sources.find(s => s.id === proposal.sourceId);
    if (!source) add("blocker", "SOURCE_MISSING", "Primary research source is missing from the package");
    else if (source.access !== "read") add("blocker", "SOURCE_UNREADABLE", "Primary source was not fully readable");
    if (proposal.proposedVerification === "disputed")
      add("blocker", "DISPUTED", "Conflicting evidence requires independent human review");
    if (proposal.conflictingSourceIds?.length)
      add("blocker", "CONFLICTING_SOURCE", "Conflicting sources must be reconciled by a reviewer");
    if (!proposal.reviewerNotes?.trim())
      add("review", "MISSING_REVIEW_NOTES", "Reviewer instructions should be recorded");
    if (proposal.evidenceBasis === "absent-from-list")
      add("review", "UNSUPPORTED_BASIS", "Absence from a list requires explicit scope and completeness verification");
  }
  const blocked = new Set(findings.filter(f => f.severity === "blocker").map(f => f.proposalId));
  return {
    status: "RESEARCH_ONLY_NOT_APPROVED",
    proposalCount: pkg.proposals.length,
    blockedCount: blocked.size,
    disputedCount: pkg.proposals.filter(p => p.proposedVerification === "disputed").length,
    findings,
    importPlanValid: plan.issues.length === 0,
    importIssues: plan.issues,
  };
}
