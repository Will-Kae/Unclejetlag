import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DATASET, ruleRecords, rules, sources as publishedSources } from "@/lib/passport/data";
import {
  RESEARCH_PACKAGE_STATUS,
  importRows,
  toCsv,
  validateResearchPackage,
  type EvidenceProposal,
  type ResearchPackage,
} from "@/lib/passport/evidence-research";
import { pairKey } from "@/lib/passport/verification";
import { researchPackage } from "../research/phase-4c3/package";

const existing = { records: ruleRecords, sources: publishedSources };
const dir = path.resolve(__dirname, "../research/phase-4c3");
const clone = (): ResearchPackage => JSON.parse(JSON.stringify(researchPackage));

/** The committed export files. Regenerate with `npm run passport:research-export`. */
function exportFiles(): Record<string, string> {
  const rows = importRows(researchPackage);
  const header = { status: RESEARCH_PACKAGE_STATUS, phase: researchPackage.phase, preparedOn: researchPackage.preparedOn, note: "Research proposals for human review. Not approved records. Do not publish." };
  return {
    "sources.json": JSON.stringify({ ...header, sources: researchPackage.sources }, null, 2) + "\n",
    "proposals.json": JSON.stringify({ ...header, proposals: researchPackage.proposals }, null, 2) + "\n",
    "submissions.import.json": JSON.stringify({ ...header, table: "passport_evidence_submissions", rows }, null, 2) + "\n",
    "submissions.import.csv": toCsv(rows),
  };
}

describe("Phase 4C.3 research package", () => {
  it("passes validation against the published dataset", () => {
    expect(validateResearchPackage(researchPackage, existing)).toEqual([]);
  });

  it("does not change published data, scores or the dataset version", () => {
    expect(DATASET.version).toBe("2026.10-s2");
    expect(ruleRecords).toHaveLength(640);
    expect(rules).toHaveLength(640);
    const ids = new Set(publishedSources.map((s) => s.id));
    for (const s of researchPackage.sources) expect(ids.has(s.id)).toBe(false);
  });

  it("never proposes a verified or approved record", () => {
    for (const p of researchPackage.proposals) expect(["pending-verification", "disputed"]).toContain(p.proposedVerification);
    for (const r of importRows(researchPackage)) {
      expect(r.status).toBe("draft");
      expect(r.research_status).toBe(RESEARCH_PACKAGE_STATUS);
    }
  });

  it("only cites sources that were read, and never a blocked one", () => {
    const blocked = new Set(researchPackage.sources.filter((s) => s.access === "blocked").map((s) => s.id));
    const partial = new Set(researchPackage.sources.filter((s) => s.access === "partial").map((s) => s.id));
    for (const p of researchPackage.proposals) {
      expect(blocked.has(p.sourceId)).toBe(false);
      expect(partial.has(p.sourceId)).toBe(false);
    }
  });

  it("marks every new pair as absent from data.ts and every corroboration as matching it", () => {
    const pairs = new Set(ruleRecords.map(pairKey));
    for (const p of researchPackage.proposals) expect(pairs.has(pairKey(p))).toBe(p.kind !== "new-pair");
  });

  it("produces rows the submit_evidence RPC would accept", () => {
    for (const r of importRows(researchPackage)) {
      expect(r.passport_code).toMatch(/^[A-Z]{3}$/);
      expect(r.destination_code).toMatch(/^[A-Z]{3}$/);
      expect(r.source_url).toMatch(/^https:\/\/[^\s]+$/);
      expect(r.rule_id.trim()).not.toBe("");
      expect(r.source_id.trim()).not.toBe("");
      expect(r.proposed_access.trim()).not.toBe("");
      expect(r.observed_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.rationale.trim().length).toBeGreaterThanOrEqual(20);
      expect(r.rationale).toContain("Not approved");
      expect(r.ai_assisted).toBe(true);
      if (r.source_document_date !== null) expect(r.source_document_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("matches the committed export files", () => {
    const files = exportFiles();
    if (process.env.UPDATE_BASELINE) {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      for (const [name, body] of Object.entries(files)) writeFileSync(path.join(dir, name), body);
    }
    for (const [name, body] of Object.entries(files)) expect(readFileSync(path.join(dir, name), "utf8"), name).toBe(body);
  });
});

describe("validateResearchPackage rejects unsafe proposals", () => {
  const first = (pkg: ResearchPackage) => pkg.proposals[0] as EvidenceProposal;

  it("a proposal marked verified", () => {
    const pkg = clone();
    (first(pkg) as { proposedVerification: string }).proposedVerification = "verified";
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/only be pending-verification or disputed/);
  });

  it("an unknown category", () => {
    const pkg = clone();
    (first(pkg) as { proposedCategory: string }).proposedCategory = "unknown";
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/category unknown not allowed/);
  });

  it("a proposal citing a source we could not read", () => {
    const pkg = clone();
    const p = pkg.proposals.find((x) => x.destination === "TZ")!;
    pkg.sources.find((s) => s.id === p.sourceId)!.access = "blocked";
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/could not be read/);
  });

  it("a commercial index as a source", () => {
    const pkg = clone();
    pkg.sources[0].url = "https://www.passportindex.org/country/tanzania";
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/lead-only domain/);
  });

  it("a check date after the package date", () => {
    const pkg = clone();
    pkg.sources[0].checked = "2026-12-01";
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/checked after the package date/);
  });

  it("a disputed proposal with no conflict described", () => {
    const pkg = clone();
    const p = pkg.proposals.find((x) => x.proposedVerification === "disputed")!;
    delete p.conflicts;
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/must name the conflict/);
  });

  it("a new pair that already exists in data.ts", () => {
    const pkg = clone();
    const p = pkg.proposals.find((x) => x.kind === "corroboration")!;
    p.kind = "new-pair";
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/marked new-pair but data.ts already has/);
  });

  it("a re-verification that is not disputed", () => {
    const pkg = clone();
    const p = pkg.proposals.find((x) => x.kind === "re-verification")!;
    p.proposedVerification = "pending-verification";
    delete p.conflictingSourceIds;
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/re-verification must be disputed/);
  });

  it("a source from another country's authority", () => {
    const pkg = clone();
    const p = pkg.proposals.find((x) => x.destination === "NA")!;
    pkg.sources.find((s) => s.id === p.sourceId)!.authorityJurisdiction = "ZA";
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/is not the destination/);
  });

  it("duplicate proposals for the same pair and source", () => {
    const pkg = clone();
    pkg.proposals.push({ ...first(pkg), id: "dup" });
    expect(validateResearchPackage(pkg, existing).join("\n")).toMatch(/duplicate passport\/destination\/source/);
  });
});
