/**
 * Phase 4C.7: Passport Evidence Review Workspace.
 * Covers dashboard calculations, filtering and search, case detail rendering, missing and
 * contradictory evidence, unauthorised access, role-based visibility and protection against mutation.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCoverageReport } from "@/lib/passport/coverage";
import { DATASET, ruleRecords, rules, sources } from "@/lib/passport/data";
import { auditEvidenceQuality } from "@/lib/passport/evidence-quality";
import type { EvidenceProposal, ResearchPackage, ResearchSource } from "@/lib/passport/evidence-research";
import { assessEvidenceQuality } from "@/lib/passport/proposal-quality";
import {
  CASE_STATUS_LABEL,
  CASE_STATUS_ORDER,
  EVIDENCE_UNAVAILABLE,
  NOT_SHOWN,
  NOT_VERIFIED,
  buildOverview,
  buildWorkspaceCases,
  filterCases,
  paginate,
  parseWorkspaceQuery,
  proposedLabel,
  publishedLabel,
  type WorkspaceInput,
} from "@/lib/passport/review-workspace";
import { loadWorkspace } from "@/lib/passport/review-workspace-data";
import { workspaceAccess } from "@/lib/passport/workspace-access";
import { CaseDetail } from "@/components/passport/workspace/CaseDetail";
import { WorkspaceView } from "@/components/passport/workspace/WorkspaceView";
import { researchPackage } from "../research/phase-4c3/package";
import { verificationBacklog } from "../research/phase-4c4/backlog";
import { RESOLUTION_PLAN_DATE, resolutionPlan } from "../research/phase-4c5/resolution-plan";

const ROOT = path.resolve(__dirname, "..");
const ws = loadWorkspace();
const byId = (id: string) => ws.cases.find((c) => c.id === id)!;
const allQuery = { q: "", country: "", status: "" as const, priority: "", quality: "" as const };

// ── Repository mirrors ──

describe("typed mirrors stay identical to the research files", () => {
  it("backlog.ts matches Phase-4C4-Verification-Backlog.csv", () => {
    const text = fs.readFileSync(path.join(ROOT, "research/phase-4c4/Phase-4C4-Verification-Backlog.csv"), "utf8").trim();
    const parse = (line: string) => [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].map((m) => m[1].replace(/^"|"$/g, "").replace(/""/g, '"')).slice(0, -1);
    const [head, ...lines] = text.split("\n");
    const cols = parse(head);
    const rows = lines.map((l) => Object.fromEntries(parse(l).map((v, i) => [cols[i], v])));
    expect(verificationBacklog.map((r) => [String(r.rank), r.priority, r.passport, r.destination, r.currentStatus, r.classification, r.reason, r.researchLead, r.knownBlocker])).toEqual(
      rows.map((r) => [r.rank, r.priority, r.passport, r.destination, r.current_status, r.classification, r.reason, r.official_research_lead, r.known_blocker]),
    );
  });

  it("resolution-plan.ts matches the Phase 4C.6 plan table and date", () => {
    const md = fs.readFileSync(path.join(ROOT, "research/phase-4c5/Phase-4C6-Evidence-Resolution-Plan.md"), "utf8");
    const rows = md.split("\n").filter((l) => /^\| P\d \|/.test(l)).map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
    expect(resolutionPlan.map((e) => [e.priority, e.case, e.currentPosition, e.evidenceNeeded, e.releaseGate])).toEqual(rows);
    expect(md).toContain(`Date: ${RESOLUTION_PLAN_DATE}.`);
  });
});

// ── Dashboard calculations ──

describe("research overview figures come from repository data", () => {
  const o = ws.overview;

  it("counts proposals, pending and disputed proposals from the research package", () => {
    expect(o.totalProposals).toBe(researchPackage.proposals.length);
    expect(o.proposalsPending).toBe(researchPackage.proposals.filter((p) => p.proposedVerification === "pending-verification").length);
    expect(o.proposalsDisputed).toBe(researchPackage.proposals.filter((p) => p.proposedVerification === "disputed").length);
    expect(o.proposalsPending + o.proposalsDisputed).toBe(o.totalProposals);
  });

  it("keeps verified published records separate from proposals and matches the publication gate", () => {
    const report = buildCoverageReport(ruleRecords, sources, DATASET);
    expect(o.verifiedPublishedRecords).toBe(rules.length);
    expect(o.totalPairs).toBe(report.universe.pairs);
    expect(o.rankingPublished).toBe(false);
    expect(o.scoredPassports).toBe(report.ranking.scoredPassports);
    expect(o.requiredForRanking).toBe(report.ranking.required);
  });

  it("reports evidence-quality counts from the quality utilities", () => {
    const issues = auditEvidenceQuality(ruleRecords, sources, DATASET.asOf);
    expect(o.qualityErrors).toBe(issues.filter((i) => i.severity === "error").length);
    expect(o.qualityWarnings).toBe(issues.filter((i) => i.severity === "warning").length);
    const findings = assessEvidenceQuality(researchPackage, { records: ruleRecords, sources }).findings;
    expect(o.proposalBlockers).toBe(findings.filter((f) => f.severity === "blocker").length);
  });

  it("status counts add up to the number of cases", () => {
    const sum = Object.values(o.casesByStatus).reduce((a, b) => a + b, 0);
    expect(sum).toBe(ws.cases.length);
    expect(o.disputedCases).toBe(o.casesByStatus.disputed + o.casesByStatus["re-verification"]);
    expect(o.evidenceUnavailable).toBe(ws.cases.filter((c) => c.status === "unavailable").length);
    expect(o.evidenceInsufficient).toBe(ws.cases.filter((c) => c.status === "insufficient").length);
    expect(o.pendingHumanVerification).toBe(ws.cases.filter((c) => c.status === "pending-verification").length);
    expect(o.awaitingReverification).toBe(ws.cases.filter((c) => c.status === "re-verification").length);
  });

  it("covers every proposal, backlog row and plan entry exactly once", () => {
    const proposalIds = ws.cases.flatMap((c) => c.proposals.map((p) => p.id)).sort();
    expect(proposalIds).toEqual(researchPackage.proposals.map((p) => p.id).sort());
    for (const b of verificationBacklog) expect(ws.cases.filter((c) => c.backlog === b)).toHaveLength(1);
    for (const e of resolutionPlan) expect(ws.cases.filter((c) => c.plan === e)).toHaveLength(1);
    expect(new Set(ws.cases.map((c) => c.id)).size).toBe(ws.cases.length);
  });

  it("lists the four priority countries in the coverage table", () => {
    const codes = ws.overview.countries.map((c) => c.code);
    for (const c of ["TZ", "NA", "MW", "GH"]) expect(codes).toContain(c);
    const tz = ws.overview.countries.find((c) => c.code === "TZ")!;
    expect(tz.publishedAsDestination).toBe(rules.filter((r) => r.destination === "TZ").length);
  });

  it("orders cases by resolution-plan priority, with the P0 Tanzania and Namibia disputes first", () => {
    const p0 = ws.cases.filter((c) => c.priority.label === "P0").map((c) => c.id).sort();
    expect(p0).toEqual(["pair-gh-tz", "pair-ng-tz", "pair-sz-na", "pair-zw-tz"]);
    expect(ws.cases.slice(0, 4).every((c) => c.priority.label === "P0")).toBe(true);
  });
});

// ── Published versus proposed ──

describe("published classifications are never taken from proposals", () => {
  it("shows the gate's published category, or Not verified", () => {
    for (const c of ws.cases) {
      const pub = rules.filter((r) => r.passport === c.passport && r.destination === c.destination);
      expect(c.published.map((p) => p.category).sort()).toEqual(pub.map((r) => r.category).sort());
      if (!pub.length) expect(publishedLabel(c)).toBe(NOT_VERIFIED);
    }
  });

  it("keeps the published Ghana → Tanzania visa-free record under re-verification, not replaced", () => {
    const c = byId("pair-gh-tz");
    expect(c.published.map((p) => p.category)).toEqual(["visa-free"]);
    expect(c.proposedCategory).toBe("visa-on-arrival");
    expect(c.status).toBe("re-verification");
    expect(proposedLabel(c)).toContain("proposed, not approved");
  });
});

// ── Filtering and search ──

describe("filtering, search and pagination", () => {
  it("filters by country on either side of the pair", () => {
    const tz = filterCases(ws.cases, { ...allQuery, country: "TZ" });
    expect(tz.length).toBeGreaterThan(0);
    expect(tz.every((c) => c.destination === "TZ" || c.passport === "TZ")).toBe(true);
    expect(tz.some((c) => c.passport === "TZ")).toBe(true);
    expect(tz.some((c) => c.destination === "TZ")).toBe(true);
    expect(tz).toHaveLength(ws.cases.filter((c) => c.destination === "TZ" || c.passport === "TZ").length);
  });

  it("filters by status, priority and evidence quality", () => {
    expect(filterCases(ws.cases, { ...allQuery, status: "disputed" }).every((c) => c.status === "disputed")).toBe(true);
    expect(filterCases(ws.cases, { ...allQuery, priority: "P0" }).map((c) => c.id).sort()).toEqual(["pair-gh-tz", "pair-ng-tz", "pair-sz-na", "pair-zw-tz"]);
    expect(filterCases(ws.cases, { ...allQuery, quality: "blocker" }).every((c) => c.quality === "blocker")).toBe(true);
    expect(filterCases(ws.cases, { ...allQuery, country: "TZ", status: "disputed", priority: "P0" }).map((c) => c.id).sort()).toEqual(["pair-ng-tz", "pair-zw-tz"]);
  });

  it("searches names, codes, proposal ids and categories, ignoring case and accents", () => {
    expect(filterCases(ws.cases, { ...allQuery, q: "ghana tanzania" }).map((c) => c.id)).toContain("pair-gh-tz");
    expect(filterCases(ws.cases, { ...allQuery, q: "p4c3-ng-mw-evisa" }).map((c) => c.id)).toEqual(["pair-ng-mw"]);
    expect(filterCases(ws.cases, { ...allQuery, q: "INSURANCE" }).map((c) => c.id)).toEqual(["topic-tz-insurance"]);
    expect(filterCases(ws.cases, { ...allQuery, q: "nowhere-at-all" })).toEqual([]);
  });

  it("drops unknown or malicious query values instead of echoing them", () => {
    const q = parseWorkspaceQuery({ q: "x".repeat(500), country: "<script>", status: "approved", priority: "P9", quality: "great", page: "-4" });
    expect(q).toEqual({ q: "x".repeat(80), country: "", status: "", priority: "", quality: "", page: 1 });
    expect(parseWorkspaceQuery({ country: "tz", status: "disputed", priority: "p1", quality: "blocker", page: ["3", "9"] })).toEqual({ q: "", country: "TZ", status: "disputed", priority: "P1", quality: "blocker", page: 3 });
  });

  it("paginates large result sets and clamps the page", () => {
    const items = Array.from({ length: 60 }, (_, i) => i);
    expect(paginate(items, 1)).toMatchObject({ page: 1, pages: 3, total: 60 });
    expect(paginate(items, 3).items).toEqual([50, 51, 52, 53, 54, 55, 56, 57, 58, 59]);
    expect(paginate(items, 99).page).toBe(3);
    expect(paginate([], 1)).toMatchObject({ page: 1, pages: 1, total: 0 });
  });
});

// ── Rendering ──

describe("case detail rendering", () => {
  it("shows the published record, proposal, sources, questions, notes, findings and history for a disputed case", () => {
    const html = renderToStaticMarkup(createElement(CaseDetail, { c: byId("pair-gh-tz") }));
    expect(html).toContain("Ghana → Tanzania");
    expect(html).toContain("Current published record");
    expect(html).toContain("Visa-free");
    expect(html).toContain("(proposed, not approved)");
    expect(html).toContain("Research data, not travel advice.");
    expect(html).toContain("Supporting official sources");
    expect(html).toContain("Conflicting sources");
    expect(html).toContain("tz-hc-kualalumpur");
    expect(html).toContain("Outstanding questions");
    expect(html).toContain("Dated written clarification from Tanzania Immigration Services Department");
    expect(html).toContain("Reviewer recommendations");
    expect(html).toContain("Automated validation findings");
    expect(html).toContain("not an immutable audit log");
    expect(html).not.toMatch(/<form|<button/);
  });

  it("shows Not verified and the partly read official source for a backlog-only case", () => {
    const c = byId("pair-bw-gh");
    expect(c.proposals).toEqual([]);
    expect(c.published).toEqual([]);
    expect(c.status).toBe("insufficient");
    const html = renderToStaticMarkup(createElement(CaseDetail, { c }));
    expect(html).toContain(`${NOT_VERIFIED}. The public index shows this pair as not yet verified.`);
    expect(html).toContain("Evidence available but insufficient");
    expect(html).toContain("Other official sources read");
    expect(html).toContain("gh-gis-evisa-launch-2026");
    expect(html).toContain("Partly readable");
    expect(html).not.toContain(`${EVIDENCE_UNAVAILABLE}:`);
    expect(html).toContain("Date not recorded");
  });

  it("renders the workspace overview, priorities, table and coverage without any write controls", () => {
    const html = renderToStaticMarkup(createElement(WorkspaceView, { cases: ws.cases, overview: ws.overview, query: parseWorkspaceQuery({}), asOf: DATASET.asOf, version: DATASET.version }));
    for (const s of ["Research overview", "Research priorities", "Evidence review table", "Country coverage", "Verified published records", "Evidence available but insufficient", "How evidence statuses are assigned", "Not published"]) expect(html).toContain(s);
    expect(html).toContain(`>${rules.length}<`);
    expect(html.match(/<form[^>]*>/g)).toEqual([expect.stringContaining('method="get"')]);
    expect(html).not.toMatch(/method="post"|<button[^>]*\sname=/i);
    expect(html).toContain("Page 1 of");
  });
});

// ── Missing and contradictory evidence ──

describe("missing and contradictory evidence", () => {
  const rs = (over: Partial<ResearchSource>): ResearchSource => ({ id: "s", title: "List", publisher: "Dept", url: "https://dept.example.gov.zz/l", type: "government", authorityJurisdiction: "TZ", publicationDate: null, checked: "2026-10-14", access: "read", note: "n", relevantPairs: [], ...over });
  const prop = (over: Partial<EvidenceProposal>): EvidenceProposal => ({ id: "p1", passport: "ZW", destination: "TZ", proposedCategory: "visa-free", evidence: "Listed as exempt", evidenceBasis: "listed", sourceId: "s", confidence: "medium", kind: "new-pair", proposedVerification: "pending-verification", ...over });
  const build = (pkgSources: ResearchSource[], proposals: EvidenceProposal[], extra: Partial<WorkspaceInput> = {}) => {
    const pkg: ResearchPackage = { status: "RESEARCH_PROPOSAL_NOT_APPROVED", phase: "4C.3", preparedOn: "2026-10-14", sources: pkgSources, proposals };
    const input: WorkspaceInput = { pkg, records: [], published: [], sources: [], backlog: [], plan: [], planDate: "2026-10-19", proposalFindings: assessEvidenceQuality(pkg, { records: [], sources: [] }).findings, qualityIssues: [], researchIssues: [], ...extra };
    return buildWorkspaceCases(input);
  };

  it("marks a proposal with conflicting sources as disputed with a blocker", () => {
    const [c] = build([rs({}), rs({ id: "s2" })], [prop({ proposedVerification: "disputed", conflictingSourceIds: ["s2"], conflicts: "Another list omits it." })]);
    expect(c.status).toBe("disputed");
    expect(c.quality).toBe("blocker");
    expect(c.sources.map((s) => `${s.role}:${s.id}`)).toEqual(["supporting:s", "conflicting:s2"]);
    expect(c.outstandingQuestions.join(" ")).toContain("Another list omits it.");
  });

  it("does not treat a proposal citing an unreadable source as pending verification", () => {
    const [c] = build([rs({ access: "partial" })], [prop({})]);
    expect(c.status).not.toBe("pending-verification");
    expect(c.quality).toBe("blocker");
  });

  it("shows proposals that disagree as multiple proposals, never picking one", () => {
    const cases = build([rs({}), rs({ id: "s2" })], [prop({}), prop({ id: "p2", sourceId: "s2", proposedCategory: "visa-on-arrival" })]);
    expect(cases).toHaveLength(1);
    expect(cases[0].proposedCategory).toBe("multiple");
    expect(proposedLabel(cases[0])).toBe("Multiple proposals");
  });

  it("labels a source with no date as not shown, and keeps file metadata dates separate", () => {
    const [c] = build([rs({ metadataDate: { date: "2026-09-05", from: "PDF metadata" } })], [prop({})]);
    expect(c.sources[0].sourceDate).toBe(NOT_SHOWN);
    expect(c.sources[0].metadataDate).toContain("2026-09-05");
    expect(c.history.some((h) => h.event.startsWith("File metadata date (not shown to readers)"))).toBe(true);
  });

  it("marks a plan topic with no linked source as evidence unavailable", () => {
    const plan = [{ id: "plan-x", priority: "P1" as const, case: "Topic", passport: null, destination: "TZ", currentPosition: "Unclear", evidenceNeeded: "A notice", releaseGate: "Review" }];
    const [c] = build([], [], { plan });
    expect(c.kind).toBe("topic");
    expect(c.status).toBe("unavailable");
    expect(c.quality).toBe("not-assessed");
    expect(c.outstandingQuestions.join(" ")).toContain(EVIDENCE_UNAVAILABLE);
  });
});

// ── Access control ──

describe("workspace access", () => {
  const id = (over: object = {}) => ({ userId: "11111111-1111-1111-1111-111111111111", role: "researcher" as const, active: true, ...over });

  it("refuses missing, inactive, unknown-role and blank identities", () => {
    expect(workspaceAccess(null).allowed).toBe(false);
    expect(workspaceAccess(undefined).allowed).toBe(false);
    expect(workspaceAccess(id({ active: false })).allowed).toBe(false);
    expect(workspaceAccess(id({ role: "editor" }) as never).allowed).toBe(false);
    expect(workspaceAccess(id({ userId: "  " })).allowed).toBe(false);
  });

  it("lets researchers and reviewers read, and shows import diagnostics to admins only", () => {
    expect(workspaceAccess(id())).toEqual({ allowed: true, showImportDiagnostics: false });
    expect(workspaceAccess(id({ role: "reviewer" }))).toEqual({ allowed: true, showImportDiagnostics: false });
    expect(workspaceAccess(id({ role: "admin" }))).toEqual({ allowed: true, showImportDiagnostics: true });
  });
});

describe("workspace routes", () => {
  const identity = vi.fn();
  const load = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    identity.mockReset();
    load.mockReset();
    vi.doMock("server-only", () => ({}));
    vi.doMock("@/lib/passport/admin-auth.server", () => ({ currentResearchIdentity: identity }));
    vi.doMock("next/navigation", () => ({
      redirect: (to: string) => {
        throw new Error(`REDIRECT:${to}`);
      },
      notFound: () => {
        throw new Error("NOT_FOUND");
      },
    }));
    vi.doMock("@/lib/passport/review-workspace-data", async (orig) => {
      const real = (await orig()) as { loadWorkspace: typeof loadWorkspace };
      load.mockImplementation(real.loadWorkspace);
      return { loadWorkspace: load };
    });
  });
  afterEach(() => vi.resetModules());

  const workspacePage = async () => (await import("@/app/passport-index/research-admin/workspace/page")).default;
  const casePage = async () => (await import("@/app/passport-index/research-admin/workspace/cases/[caseId]/page")).default;
  const researcher = { userId: "11111111-1111-1111-1111-111111111111", role: "researcher", active: true };

  it("redirects unauthenticated visitors to sign-in before loading any research data", async () => {
    identity.mockResolvedValue(null);
    const Page = await workspacePage();
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/passport-index/research-admin/login");
    expect(load).not.toHaveBeenCalled();
  });

  it("redirects inactive profiles and hides case existence from unauthenticated visitors", async () => {
    identity.mockResolvedValue({ ...researcher, active: false });
    const Page = await workspacePage();
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:");
    identity.mockResolvedValue(null);
    const Case = await casePage();
    await expect(Case({ params: Promise.resolve({ caseId: "does-not-exist" }) })).rejects.toThrow("REDIRECT:/passport-index/research-admin/login");
    await expect(Case({ params: Promise.resolve({ caseId: "pair-gh-tz" }) })).rejects.toThrow("REDIRECT:/passport-index/research-admin/login");
    expect(load).not.toHaveBeenCalled();
  });

  it("renders for a researcher without administrator diagnostics", async () => {
    identity.mockResolvedValue(researcher);
    const Page = await workspacePage();
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ country: "TZ" }) }));
    expect(html).toContain("Evidence review workspace");
    expect(html).not.toContain("Administrators only");
  });

  it("shows administrator diagnostics only to admins", async () => {
    identity.mockResolvedValue({ ...researcher, role: "admin" });
    const Page = await workspacePage();
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Administrators only");
    expect(html).toContain("Draft evidence import preview");
  });

  it("returns not found for unknown or malformed case ids once authenticated", async () => {
    identity.mockResolvedValue(researcher);
    const Case = await casePage();
    await expect(Case({ params: Promise.resolve({ caseId: "../../etc" }) })).rejects.toThrow("NOT_FOUND");
    await expect(Case({ params: Promise.resolve({ caseId: "pair-xx-yy" }) })).rejects.toThrow("NOT_FOUND");
    const html = renderToStaticMarkup(await Case({ params: Promise.resolve({ caseId: "pair-gh-tz" }) }));
    expect(html).toContain("Ghana → Tanzania");
  });
});

// ── Mutation protection ──

describe("protection against unintended data mutation", () => {
  const deepFreeze = <T>(o: T): T => {
    if (o && typeof o === "object" && !Object.isFrozen(o)) {
      Object.freeze(o);
      for (const v of Object.values(o as object)) deepFreeze(v);
    }
    return o;
  };

  it("builds the workspace from frozen inputs without changing them", () => {
    const snapshot = JSON.stringify([ws.input.pkg, ws.input.records, ws.input.published, ws.input.sources, ws.input.backlog, ws.input.plan]);
    const frozen = deepFreeze(structuredClone(ws.input));
    expect(() => buildOverview(buildWorkspaceCases(frozen), frozen, buildCoverageReport(ruleRecords, sources, DATASET))).not.toThrow();
    loadWorkspace();
    expect(JSON.stringify([ws.input.pkg, ws.input.records, ws.input.published, ws.input.sources, ws.input.backlog, ws.input.plan])).toBe(snapshot);
  });

  it("leaves published data and the ranking gate unchanged", () => {
    expect(DATASET.version).toBe("2026.10-s2");
    expect(ruleRecords).toHaveLength(640);
    expect(rules).toHaveLength(640);
    expect(ws.overview.rankingPublished).toBe(false);
  });

  const files = [
    "src/app/passport-index/research-admin/workspace/page.tsx",
    "src/app/passport-index/research-admin/workspace/cases/[caseId]/page.tsx",
    "src/components/passport/workspace/WorkspaceView.tsx",
    "src/components/passport/workspace/CaseDetail.tsx",
    "src/components/passport/workspace/badges.tsx",
    "src/lib/passport/review-workspace.ts",
    "src/lib/passport/review-workspace-data.ts",
    "src/lib/passport/workspace-access.ts",
  ];

  it("contains no server actions, write requests, database clients or secrets", () => {
    for (const f of files) {
      const src = fs.readFileSync(path.join(ROOT, f), "utf8");
      expect(src, f).not.toMatch(/["']use server["']|["']use client["']/);
      expect(src, f).not.toMatch(/\bfetch\s*\(|\.rpc\s*\(|\.(insert|upsert|update|delete)\s*\(|createClient|SERVICE_ROLE|service_role|SUPABASE_SERVICE/);
      expect(src, f).not.toMatch(/method=["']post["']|formAction|<button[^>]*type=["']submit["'][^>]*\sname=/i);
      expect(src, f).not.toMatch(/writeFile|appendFile|localStorage|sessionStorage/);
    }
  });

  it("adds no API route or route handler under the workspace", () => {
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    const wsFiles = walk(path.join(ROOT, "src/app/passport-index/research-admin/workspace"));
    expect(wsFiles.filter((f) => /route\.(t|j)sx?$/.test(f))).toEqual([]);
    expect(fs.existsSync(path.join(ROOT, "src/app/api/passport-research"))).toBe(false);
  });

  it("gates both workspace pages on the existing server-side identity before rendering data", () => {
    for (const f of files.slice(0, 2)) {
      const src = fs.readFileSync(path.join(ROOT, f), "utf8");
      expect(src).toContain('import "server-only"');
      expect(src).toContain("workspaceAccess(await currentResearchIdentity())");
      expect(src.indexOf("redirect(")).toBeLessThan(src.indexOf("loadWorkspace()"));
      expect(src).toMatch(/robots: \{ index: false, follow: false \}/);
    }
  });

  it("uses only labels defined for case statuses", () => {
    for (const c of ws.cases) expect(Object.keys(CASE_STATUS_LABEL)).toContain(c.status);
  });
});

// ── Phase 4C.7 remediation: evidence-status classification ──

describe("evidence status is derived from evidence, not from plan membership", () => {
  const rs = (over: Partial<ResearchSource>): ResearchSource => ({ id: "s", title: "List", publisher: "Dept", url: "https://dept.example.gov.zz/l", type: "government", authorityJurisdiction: "TZ", publicationDate: null, checked: "2026-10-14", access: "read", note: "n", relevantPairs: [], ...over });
  const prop = (over: Partial<EvidenceProposal>): EvidenceProposal => ({ id: "p1", passport: "ZW", destination: "TZ", proposedCategory: "visa-free", evidence: "Listed as exempt", evidenceBasis: "listed", sourceId: "s", confidence: "medium", kind: "new-pair", proposedVerification: "pending-verification", ...over });
  const planEntry = (over: object = {}) => ({ id: "plan-zw-tz", priority: "P0" as const, case: "Zimbabwe → Tanzania", passport: "ZW" as string | null, destination: "TZ", currentPosition: "Unverified", evidenceNeeded: "A notice", releaseGate: "Review", ...over });
  const backlogRow = { rank: 1, priority: "P1" as const, passport: "ZW", destination: "TZ", currentStatus: "not verified", classification: "UNASSIGNED - research required", reason: "r", researchLead: "https://dept.example.gov.zz", knownBlocker: "No list found" };
  const pubRule = (over: object = {}) => ({ passport: "ZW", destination: "TZ", category: "visa-free" as const, maxStayDays: 90, evidence: "Listed", sourceId: "ps", verification: "verified" as const, confidence: "high" as const, ...over });
  const pubSource = { id: "ps", title: "Published list", publisher: "Embassy", url: "https://emb.example.gov.zz", type: "embassy" as const, authorityJurisdiction: "TZ", checked: "2026-10-10" };
  const build = (opts: { pkgSources?: ResearchSource[]; proposals?: EvidenceProposal[]; extra?: Partial<WorkspaceInput> }) => {
    const pkg: ResearchPackage = { status: "RESEARCH_PROPOSAL_NOT_APPROVED", phase: "4C.3", preparedOn: "2026-10-14", sources: opts.pkgSources ?? [], proposals: opts.proposals ?? [] };
    const input: WorkspaceInput = { pkg, records: [], published: [], sources: [], backlog: [], plan: [], planDate: "2026-10-19", proposalFindings: assessEvidenceQuality(pkg, { records: [], sources: [] }).findings, qualityIssues: [], researchIssues: [], ...opts.extra };
    return buildWorkspaceCases(input);
  };

  it("1. no official evidence: a backlog blocker or plan entry alone gives Evidence unavailable, never blocked", () => {
    const [a] = build({ extra: { backlog: [backlogRow] } });
    expect(a.status).toBe("unavailable");
    const [b] = build({ extra: { plan: [planEntry()] } });
    expect(b.status).toBe("unavailable");
    const [c] = build({ pkgSources: [rs({ access: "blocked", relevantPairs: ["ZW>TZ"] })], extra: { backlog: [backlogRow] } });
    expect(c.status).toBe("unavailable");
    expect(CASE_STATUS_LABEL.unavailable).toBe(EVIDENCE_UNAVAILABLE);
  });

  it("2. partially readable evidence is available but insufficient", () => {
    const [a] = build({ pkgSources: [rs({ access: "partial" })], proposals: [prop({})] });
    expect(a.status).toBe("insufficient");
    const [b] = build({ pkgSources: [rs({ access: "partial", relevantPairs: ["ZW>TZ"] })], extra: { backlog: [backlogRow] } });
    expect(b.status).toBe("insufficient");
    expect(b.outstandingQuestions.join(" ")).toContain("Evidence available but insufficient");
    expect(b.outstandingQuestions.join(" ")).not.toContain(`${EVIDENCE_UNAVAILABLE}:`);
  });

  it("3. conflicting official sources make a case disputed, from proposals or from linked sources", () => {
    const [a] = build({ pkgSources: [rs({}), rs({ id: "s2" })], proposals: [prop({ conflictingSourceIds: ["s2"], proposedVerification: "disputed", conflicts: "x" })] });
    expect(a.status).toBe("disputed");
    const links = [{ caseIds: ["pair-zw-tz"], sourceId: "s", role: "supporting" as const, reason: "a" }, { caseIds: ["pair-zw-tz"], sourceId: "s2", role: "conflicting" as const, reason: "b" }];
    const [b] = build({ pkgSources: [rs({}), rs({ id: "s2" })], extra: { backlog: [backlogRow], evidenceLinks: links } });
    expect(b.status).toBe("disputed");
    for (const id of ["pair-zw-tz", "pair-ng-tz", "pair-sz-na", "topic-mw-visa-fee", "topic-gh-african-entry-policy"]) expect(byId(id).status, id).toBe("disputed");
  });

  it("4. a fully read source with no conflict awaits human verification", () => {
    const [a] = build({ pkgSources: [rs({})], proposals: [prop({})], extra: { plan: [planEntry()] } });
    expect(a.status).toBe("pending-verification");
    expect(byId("pair-ng-mw").status).toBe("pending-verification");
    expect(byId("pair-gh-mz").status).toBe("pending-verification");
  });

  it("5. a published record questioned by a dispute or the plan is awaiting re-verification, value unchanged", () => {
    const [a] = build({ extra: { published: [pubRule()], records: [pubRule()], sources: [pubSource], plan: [planEntry()] } });
    expect(a.status).toBe("re-verification");
    expect(a.published.map((p) => p.category)).toEqual(["visa-free"]);
    const [b] = build({ extra: { published: [pubRule()], records: [pubRule()], sources: [pubSource], backlog: [backlogRow] } });
    expect(b.status).toBe("published");
    expect(byId("pair-gh-tz").status).toBe("re-verification");
    expect(byId("pair-gh-na").status).toBe("re-verification");
    expect(byId("pair-gh-na").published.map((p) => p.category)).toEqual(["visa-on-arrival"]);
  });

  it("6. destination-wide topics take their status from linked sources", () => {
    expect(byId("topic-tz-insurance").status).toBe("insufficient");
    expect(byId("topic-mw-visa-fee").status).toBe("disputed");
    expect(byId("topic-gh-african-entry-policy").status).toBe("disputed");
    expect(byId("topic-mw-exemption-list").status).toBe("insufficient");
    for (const c of ws.cases.filter((x) => x.kind === "topic")) {
      expect(c.published).toEqual([]);
      expect(c.sources.length).toBeGreaterThan(0);
    }
    const fee = byId("topic-mw-visa-fee");
    expect(fee.sources.filter((s) => s.role === "conflicting").map((s) => s.id).sort()).toEqual(["mw-embassy-berlin-visa-fees", "mw-embassy-brussels-visa-fees"]);
  });

  it("removing the resolution plan changes no unpublished case's status", () => {
    const without = buildWorkspaceCases({ ...ws.input, plan: [] });
    for (const c of ws.cases.filter((x) => x.kind === "pair" && x.published.length === 0)) {
      expect(without.find((x) => x.id === c.id)?.status, c.id).toBe(c.status);
    }
  });

  it("7. status counts, badges and filters agree", () => {
    const total = CASE_STATUS_ORDER.reduce((n, s) => n + ws.overview.casesByStatus[s], 0);
    expect(total).toBe(ws.cases.length);
    for (const s of CASE_STATUS_ORDER) {
      expect(filterCases(ws.cases, { ...allQuery, status: s })).toHaveLength(ws.overview.casesByStatus[s]);
      expect(parseWorkspaceQuery({ status: s }).status).toBe(s);
    }
    expect(parseWorkspaceQuery({ status: "blocked" }).status).toBe("");
    expect(parseWorkspaceQuery({ status: "not-verified" }).status).toBe("");
    const html = renderToStaticMarkup(createElement(WorkspaceView, { cases: ws.cases, overview: ws.overview, query: parseWorkspaceQuery({}), asOf: DATASET.asOf, version: DATASET.version }));
    for (const s of CASE_STATUS_ORDER) expect(html).toContain(CASE_STATUS_LABEL[s]);
    expect(html).not.toContain("Blocked: evidence unavailable");
  });

  it("8. no published classification changes, and published pairs are only published or awaiting re-verification", () => {
    for (const c of ws.cases.filter((x) => x.published.length > 0)) expect(["published", "re-verification"]).toContain(c.status);
    for (const c of ws.cases.filter((x) => x.published.length === 0)) expect(["published", "re-verification"]).not.toContain(c.status);
    const byPair = new Map(rules.map((r) => [`${r.passport}>${r.destination}`, r.category]));
    for (const c of ws.cases) for (const p of c.published) expect(p.category).toBe(byPair.get(`${c.passport}>${c.destination}`));
    expect(rules).toHaveLength(640);
  });

  it("never fabricates source dates", () => {
    const all = [...ws.input.pkg.sources, ...(ws.input.supplementarySources ?? [])];
    for (const c of ws.cases) for (const s of c.sources) {
      const research = all.find((x) => x.id === s.id);
      const published = sources.find((x) => x.id === s.id);
      const expected = research ? research.publicationDate ?? NOT_SHOWN : published?.sourceUpdated ?? NOT_SHOWN;
      expect(s.sourceDate, `${c.id}/${s.id}`).toBe(expected);
    }
    expect(byId("topic-mw-visa-fee").sources.find((s) => s.id === "mw-embassy-berlin-visa-fees")?.sourceDate).toBe(NOT_SHOWN);
  });

  it("treats unknown classifications as not verified", () => {
    const [a] = build({ extra: { published: [pubRule({ category: "unknown" })], records: [pubRule({ category: "unknown" })], sources: [pubSource], backlog: [backlogRow] } });
    expect(a.published).toEqual([]);
    expect(a.status).toBe("unavailable");
    expect(publishedLabel(a)).toBe(NOT_VERIFIED);
    expect(proposedLabel({ proposedCategory: "unknown" })).toContain(NOT_VERIFIED);
  });
});

describe("evidence-link register", () => {
  const report = fs.readFileSync(path.join(ROOT, "research/phase-4c4/Phase-4C4-Evidence-Quality-Report.md"), "utf8");

  it("only restates sources documented in the Phase 4C.4 report, with the same access date", async () => {
    const { supplementarySources } = await import("../research/phase-4c7/evidence-links");
    for (const s of supplementarySources) {
      const row = report.split("\n").find((l) => l.includes(s.url));
      expect(row, s.url).toBeTruthy();
      expect(row).toContain(s.checked);
      expect(ws.input.pkg.sources.some((x) => x.id === s.id)).toBe(false);
    }
  });

  it("links only existing sources to existing cases, each with a reason", async () => {
    const { evidenceLinks, supplementarySources } = await import("../research/phase-4c7/evidence-links");
    const ids = new Set([...ws.input.pkg.sources, ...supplementarySources].map((s) => s.id));
    const caseIds = new Set(ws.cases.map((c) => c.id));
    for (const l of evidenceLinks) {
      expect(ids.has(l.sourceId), l.sourceId).toBe(true);
      expect(l.reason.trim().length).toBeGreaterThan(10);
      for (const id of l.caseIds) expect(caseIds.has(id), id).toBe(true);
    }
  });
});
