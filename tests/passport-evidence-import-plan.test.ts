import { describe, expect, it } from "vitest";
import { ruleRecords, sources } from "@/lib/passport/data";
import { planDraftImport, draftFields } from "@/lib/passport/evidence-import-plan";
import { importRows } from "@/lib/passport/evidence-research";
import { researchPackage } from "../research/phase-4c3/package";

const existing = { records: ruleRecords, sources };
const clone = () => JSON.parse(JSON.stringify(researchPackage)) as typeof researchPackage;

describe("Phase 4C.3 offline draft import planner", () => {
  it("produces 28 whitelisted draft-only records without write capabilities", () => {
    const plan = planDraftImport(researchPackage, existing);
    expect(plan.issues).toEqual([]);
    expect(plan.status).toBe("DRY_RUN_ONLY");
    expect(plan.total).toBe(28);
    expect(plan.disputed).toBe(4);
    expect(plan.pendingVerification).toBe(24);
    expect(plan.rows).toHaveLength(28);
    for (const row of plan.rows) {
      expect(Object.keys(row).sort()).toEqual([
        "ai_assisted", "destination_code", "observed_at", "passport_code",
        "proposed_access", "rationale", "rule_id", "source_document_date",
        "source_id", "source_url",
      ].sort());
      expect(row.rationale).toContain("Not approved");
    }
  });

  it("rejects a source that is only partially readable", () => {
    const pkg = clone();
    const source = pkg.sources.find(s => pkg.proposals.some(p => p.sourceId === s.id))!;
    source.access = "partial";
    const plan = planDraftImport(pkg, existing);
    expect(plan.rows).toEqual([]);
    expect(plan.issues.join(" ")).toContain("partial source");
  });

  it("rejects approval marker tampering", () => {
    const pkg = clone();
    (pkg.proposals[0] as { proposedVerification: string }).proposedVerification = "verified";
    const plan = planDraftImport(pkg, existing);
    expect(plan.rows).toEqual([]);
    expect(plan.issues.length).toBeGreaterThan(0);
  });

  it("does not forward research-only fields to a table write", () => {
    const row = importRows(researchPackage)[0];
    const fields = draftFields(row);
    expect("research_proposal_id" in fields).toBe(false);
    expect("research_status" in fields).toBe(false);
    expect("proposed_verification" in fields).toBe(false);
    expect("confidence" in fields).toBe(false);
    expect("status" in fields).toBe(false);
  });
});
