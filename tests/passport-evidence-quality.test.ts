import { describe, expect, it } from "vitest";
import { ruleRecords, sources } from "@/lib/passport/data";
import { assessEvidenceQuality } from "@/lib/passport/evidence-quality";
import { researchPackage } from "../research/phase-4c3/package";

const existing = { records: ruleRecords, sources };
const clone = () => JSON.parse(JSON.stringify(researchPackage)) as typeof researchPackage;

describe("Phase 4C.4 read-only evidence quality", () => {
  it("flags all four disputed proposals without approving any proposal", () => {
    const report = assessEvidenceQuality(researchPackage, existing);
    expect(report.status).toBe("RESEARCH_ONLY_NOT_APPROVED");
    expect(report.proposalCount).toBe(28);
    expect(report.disputedCount).toBe(4);
    expect(report.findings.filter(f => f.code === "DISPUTED")).toHaveLength(4);
    expect(report.blockedCount).toBeGreaterThanOrEqual(4);
    expect(report.importPlanValid).toBe(true);
  });

  it("blocks sources that are only partially readable", () => {
    const pkg = clone();
    const proposal = pkg.proposals[0];
    pkg.sources.find(s => s.id === proposal.sourceId)!.access = "partial";
    const report = assessEvidenceQuality(pkg, existing);
    expect(report.importPlanValid).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({
      proposalId: proposal.id, code: "SOURCE_UNREADABLE", severity: "blocker",
    }));
  });

  it("reports incomplete evidence basis for human review", () => {
    const pkg = clone();
    pkg.proposals[0].evidenceBasis = "absent-from-list";
    const report = assessEvidenceQuality(pkg, existing);
    expect(report.findings).toContainEqual(expect.objectContaining({
      proposalId: pkg.proposals[0].id, code: "UNSUPPORTED_BASIS", severity: "review",
    }));
  });
});
