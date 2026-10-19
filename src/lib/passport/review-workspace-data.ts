/**
 * Phase 4C.7: assembles the Evidence Review Workspace from repository data only.
 * Read-only: no database client, no network request, no writes. Imported only by the authenticated
 * research-admin workspace pages (and tests).
 */
import { buildCoverageReport } from "./coverage";
import { DATASET, ruleRecords, rules, sources } from "./data";
import { auditEvidenceQuality } from "./evidence-quality";
import { validateResearchPackage } from "./evidence-research";
import { assessEvidenceQuality } from "./proposal-quality";
import { buildOverview, buildWorkspaceCases, type ResearchCase, type WorkspaceInput, type WorkspaceOverview } from "./review-workspace";
import { researchPackage } from "../../../research/phase-4c3/package";
import { verificationBacklog } from "../../../research/phase-4c4/backlog";
import { RESOLUTION_PLAN_DATE, resolutionPlan } from "../../../research/phase-4c5/resolution-plan";
import { evidenceLinks, supplementarySources } from "../../../research/phase-4c7/evidence-links";

export type Workspace = { input: WorkspaceInput; cases: ResearchCase[]; overview: WorkspaceOverview; dataset: typeof DATASET };

export function loadWorkspace(): Workspace {
  const proposalReport = assessEvidenceQuality(researchPackage, { records: ruleRecords, sources });
  const input: WorkspaceInput = {
    pkg: researchPackage,
    supplementarySources,
    evidenceLinks,
    records: ruleRecords,
    published: rules,
    sources,
    backlog: verificationBacklog,
    plan: resolutionPlan,
    planDate: RESOLUTION_PLAN_DATE,
    proposalFindings: proposalReport.findings,
    qualityIssues: auditEvidenceQuality(ruleRecords, sources, DATASET.asOf),
    researchIssues: validateResearchPackage(researchPackage, { records: ruleRecords, sources }),
  };
  const cases = buildWorkspaceCases(input);
  const overview = buildOverview(cases, input, buildCoverageReport(ruleRecords, sources, DATASET));
  return { input, cases, overview, dataset: DATASET };
}
