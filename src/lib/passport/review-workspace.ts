/**
 * Phase 4C.7: Passport Evidence Review Workspace — data model.
 *
 * Pure, read-only functions. Nothing here imports a database client, performs a network request or
 * writes to any store. Every figure is derived from repository data:
 *  - published records and sources: src/lib/passport/data.ts (through the publication gate);
 *  - research proposals and research sources: research/phase-4c3/package.ts;
 *  - verification backlog: research/phase-4c4 (typed mirror of the CSV);
 *  - resolution plan: research/phase-4c5 (typed mirror of the Phase 4C.6 plan);
 *  - automated findings: evidence-quality.ts and proposal-quality.ts.
 *
 * A proposal is never treated as approved, and a missing value is shown as "Not verified" or
 * "Evidence unavailable", never inferred.
 */
import type { CoverageReport } from "./coverage";
import type { EvidenceProposal, ResearchPackage, ResearchSource } from "./evidence-research";
import type { QualityIssue } from "./evidence-quality";
import { getJurisdiction, jName } from "./jurisdictions";
import type { QualityFinding } from "./proposal-quality";
import type { AccessCategory, AccessRule, Source } from "./types";
import { categoryMeta } from "./types";
import { pairKey, ruleId } from "./verification";
import type { BacklogRow } from "../../../research/phase-4c4/backlog";
import type { ResolutionPlanEntry } from "../../../research/phase-4c5/resolution-plan";

export const NOT_VERIFIED = "Not verified";
export const EVIDENCE_UNAVAILABLE = "Evidence unavailable";
export const NOT_SHOWN = "Not shown on source";

/** Countries the Phase 4C.6 plan prioritises. */
export const FOCUS_COUNTRIES = ["TZ", "NA", "MW", "GH"] as const;

export type CaseStatus = "published" | "re-verification" | "pending-verification" | "disputed" | "blocked" | "not-verified";
export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  published: "Published (verified)",
  "re-verification": "Published, under re-verification",
  "pending-verification": "Pending verification",
  disputed: "Disputed",
  blocked: "Blocked: evidence unavailable",
  "not-verified": NOT_VERIFIED,
};

export type EvidenceQualityLevel = "blocker" | "review" | "clear" | "not-assessed";
export const QUALITY_LABEL: Record<EvidenceQualityLevel, string> = {
  blocker: "Blocker",
  review: "Needs review",
  clear: "No automated findings",
  "not-assessed": "Not assessed",
};

export type CaseSource = {
  id: string;
  role: "supporting" | "conflicting" | "published";
  publisher: string;
  title: string;
  url: string;
  type: string;
  checked: string;
  /** The date the source itself shows, or NOT_SHOWN. Never inferred. */
  sourceDate: string;
  /** Dates found only in file metadata, labelled as such. */
  metadataDate: string | null;
  access: "read" | "partial" | "blocked" | "published-register";
  note: string | null;
};

export type CaseFinding = { origin: "proposal-quality" | "evidence-quality" | "research-validation"; severity: string; code: string; subject: string; message: string };

export type HistoryEvent = { date: string | null; event: string; origin: string };

export type CaseProposal = Pick<EvidenceProposal, "id" | "proposedCategory" | "proposedVerification" | "confidence" | "kind" | "evidence" | "evidenceBasis" | "conditions" | "conflicts" | "reviewerNotes" | "maxStayDays"> & {
  sourceId: string;
};

export type ResearchCase = {
  id: string;
  kind: "pair" | "topic";
  title: string;
  passport: string | null;
  destination: string;
  /** Published records for the pair (after the publication gate). Empty means "Not verified". */
  published: { ruleId: string; category: AccessCategory; maxStayDays: number | null; sourceId: string; checked: string | null }[];
  proposals: CaseProposal[];
  /** Single proposed category, "multiple" when proposals disagree, null when there is no proposal. */
  proposedCategory: AccessCategory | "multiple" | null;
  status: CaseStatus;
  priority: { rank: number; label: string; origin: string };
  plan: ResolutionPlanEntry | null;
  backlog: BacklogRow | null;
  relatedPairs: string[];
  sources: CaseSource[];
  primarySource: { authority: string; checked: string } | null;
  quality: EvidenceQualityLevel;
  findings: CaseFinding[];
  outstandingQuestions: string[];
  researcherNotes: { origin: string; text: string }[];
  reviewerRecommendations: { origin: string; text: string }[];
  history: HistoryEvent[];
};

export type WorkspaceInput = {
  pkg: ResearchPackage;
  records: AccessRule[];
  published: AccessRule[];
  sources: Source[];
  backlog: BacklogRow[];
  plan: ResolutionPlanEntry[];
  planDate: string;
  proposalFindings: QualityFinding[];
  qualityIssues: QualityIssue[];
  researchIssues: string[];
};

const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

const pairTitle = (p: string, d: string) => `${jName(p)} → ${jName(d)}`;

function fromResearchSource(s: ResearchSource, role: CaseSource["role"]): CaseSource {
  return {
    id: s.id,
    role,
    publisher: s.publisher,
    title: s.title,
    url: s.url,
    type: s.type,
    checked: s.checked,
    sourceDate: s.publicationDate ?? NOT_SHOWN,
    metadataDate: s.metadataDate ? `${s.metadataDate.date} (${s.metadataDate.from})` : null,
    access: s.access,
    note: s.note,
  };
}

function fromPublishedSource(s: Source, role: CaseSource["role"]): CaseSource {
  return {
    id: s.id,
    role,
    publisher: s.publisher,
    title: s.title,
    url: s.url,
    type: s.type,
    checked: s.checked,
    sourceDate: s.sourceUpdated ?? NOT_SHOWN,
    metadataDate: null,
    access: "published-register",
    note: s.note ?? null,
  };
}

/** Build every research case. Inputs are never mutated. */
export function buildWorkspaceCases(input: WorkspaceInput): ResearchCase[] {
  const { pkg, published, sources, backlog, plan, planDate } = input;
  const researchSources = new Map(pkg.sources.map((s) => [s.id, s]));
  const publishedSources = new Map(sources.map((s) => [s.id, s]));
  const sourceById = (id: string, role: CaseSource["role"]): CaseSource | null => {
    const r = researchSources.get(id);
    if (r) return fromResearchSource(r, role);
    const p = publishedSources.get(id);
    return p ? fromPublishedSource(p, role) : null;
  };

  const pairKeys = new Set<string>();
  for (const p of pkg.proposals) pairKeys.add(`${p.passport}>${p.destination}`);
  for (const b of backlog) pairKeys.add(`${b.passport}>${b.destination}`);
  for (const e of plan) if (e.passport) pairKeys.add(`${e.passport}>${e.destination}`);

  const cases: ResearchCase[] = [];

  for (const key of [...pairKeys].sort()) {
    const [passport, destination] = key.split(">");
    const proposals = pkg.proposals.filter((p) => p.passport === passport && p.destination === destination);
    const pub = published.filter((r) => r.passport === passport && r.destination === destination);
    const planEntry = plan.find((e) => e.passport === passport && e.destination === destination) ?? null;
    const backlogRow = backlog.find((b) => b.passport === passport && b.destination === destination) ?? null;
    const proposalIds = new Set(proposals.map((p) => p.id));
    const pubIds = new Set(pub.map(ruleId));
    const pubSourceIds = new Set(pub.flatMap((r) => [r.sourceId, ...(r.additionalSourceIds ?? [])]));

    const caseSources: CaseSource[] = [];
    const addSource = (id: string, role: CaseSource["role"]) => {
      if (caseSources.some((s) => s.id === id && s.role === role)) return;
      const s = sourceById(id, role);
      if (s) caseSources.push(s);
    };
    for (const r of pub) {
      addSource(r.sourceId, "published");
      for (const extra of r.additionalSourceIds ?? []) addSource(extra, "published");
    }
    for (const p of proposals) {
      addSource(p.sourceId, "supporting");
      for (const id of p.supportingSourceIds ?? []) addSource(id, "supporting");
      for (const id of p.conflictingSourceIds ?? []) addSource(id, "conflicting");
    }

    const findings: CaseFinding[] = [
      ...input.proposalFindings.filter((f) => proposalIds.has(f.proposalId)).map((f) => ({ origin: "proposal-quality" as const, severity: f.severity, code: f.code, subject: f.proposalId, message: f.message })),
      ...input.qualityIssues.filter((i) => pubIds.has(i.subject) || pubSourceIds.has(i.subject) || i.subject === key).map((i) => ({ origin: "evidence-quality" as const, severity: i.severity, code: i.code, subject: i.subject, message: i.message })),
      ...input.researchIssues.filter((m) => proposals.some((p) => m.startsWith(`${p.id}:`))).map((m) => ({ origin: "research-validation" as const, severity: "error", code: "research-package", subject: m.split(":")[0], message: m })),
    ];

    const disputed = proposals.some((p) => p.proposedVerification === "disputed" || (p.conflictingSourceIds?.length ?? 0) > 0);
    const hasReadProposal = proposals.some((p) => researchSources.get(p.sourceId)?.access === "read" || publishedSources.has(p.sourceId));
    let status: CaseStatus;
    if (pub.length && (disputed || planEntry)) status = "re-verification";
    else if (pub.length) status = "published";
    else if (disputed) status = "disputed";
    else if (proposals.length && hasReadProposal) status = "pending-verification";
    else if (planEntry || backlogRow?.knownBlocker) status = "blocked";
    else status = "not-verified";

    cases.push(
      finishCase({
        id: `pair-${passport.toLowerCase()}-${destination.toLowerCase()}`,
        kind: "pair",
        title: pairTitle(passport, destination),
        passport,
        destination,
        published: pub.map((r) => ({ ruleId: ruleId(r), category: r.category, maxStayDays: r.maxStayDays ?? null, sourceId: r.sourceId, checked: publishedSources.get(r.sourceId)?.checked ?? null })),
        proposals: proposals.map(toCaseProposal),
        status,
        plan: planEntry,
        backlog: backlogRow,
        relatedPairs: [],
        sources: caseSources,
        findings,
      }, pkg, planDate),
    );
  }

  // Destination-wide topics from the resolution plan (insurance, fees, entry policy, exemption lists).
  for (const e of plan.filter((x) => !x.passport)) {
    const relatedPairs = [...new Set([...backlog.filter((b) => b.destination === e.destination).map((b) => `${b.passport}>${b.destination}`)])].sort();
    cases.push(
      finishCase({
        id: e.id.replace(/^plan-/, "topic-"),
        kind: "topic",
        title: e.case,
        passport: null,
        destination: e.destination,
        published: [],
        proposals: [],
        status: "blocked",
        plan: e,
        backlog: null,
        relatedPairs,
        sources: [],
        findings: [],
      }, pkg, planDate),
    );
  }

  return cases.sort((a, b) => a.priority.rank - b.priority.rank || focusRank(a) - focusRank(b) || a.title.localeCompare(b.title));
}

const focusRank = (c: Pick<ResearchCase, "destination">) => ((FOCUS_COUNTRIES as readonly string[]).includes(c.destination) ? 0 : 1);

function toCaseProposal(p: EvidenceProposal): CaseProposal {
  return {
    id: p.id,
    proposedCategory: p.proposedCategory,
    proposedVerification: p.proposedVerification,
    confidence: p.confidence,
    kind: p.kind,
    evidence: p.evidence,
    evidenceBasis: p.evidenceBasis,
    conditions: p.conditions,
    conflicts: p.conflicts,
    reviewerNotes: p.reviewerNotes,
    maxStayDays: p.maxStayDays,
    sourceId: p.sourceId,
  };
}

type Draft = Omit<ResearchCase, "proposedCategory" | "priority" | "primarySource" | "quality" | "outstandingQuestions" | "researcherNotes" | "reviewerRecommendations" | "history">;

function finishCase(d: Draft, pkg: ResearchPackage, planDate: string): ResearchCase {
  const cats = [...new Set(d.proposals.map((p) => p.proposedCategory))];
  const proposedCategory = cats.length === 0 ? null : cats.length === 1 ? cats[0] : "multiple";

  const priority = d.plan
    ? { rank: PRIORITY_RANK[d.plan.priority], label: d.plan.priority, origin: "Phase 4C.6 resolution plan" }
    : d.backlog
      ? { rank: PRIORITY_RANK[d.backlog.priority], label: d.backlog.priority, origin: `Phase 4C.4 backlog (rank ${d.backlog.rank})` }
      : { rank: 9, label: "Unranked", origin: "Not in the resolution plan or backlog" };

  const primary = d.sources.find((s) => s.role === "supporting") ?? d.sources.find((s) => s.role === "published") ?? null;

  const blockers = d.findings.some((f) => f.severity === "blocker" || f.severity === "error");
  const reviews = d.findings.length > 0;
  const quality: EvidenceQualityLevel = blockers ? "blocker" : reviews ? "review" : d.proposals.length || d.published.length ? "clear" : "not-assessed";

  const outstandingQuestions = [
    ...(d.plan ? [`To close (Phase 4C.6 plan): ${d.plan.evidenceNeeded}`] : []),
    ...(d.backlog?.knownBlocker ? [`Known blocker (Phase 4C.4 backlog): ${d.backlog.knownBlocker}`] : []),
    ...d.proposals.filter((p) => p.conflicts).map((p) => `Unresolved conflict in ${p.id}: ${p.conflicts}`),
    ...(d.published.length === 0 && d.proposals.length === 0 ? [`${EVIDENCE_UNAVAILABLE}: no official source has been read for this case yet.`] : []),
  ];

  const researcherNotes = [
    ...(d.backlog ? [{ origin: `Phase 4C.4 backlog (rank ${d.backlog.rank})`, text: d.backlog.reason }] : []),
    ...(d.backlog?.researchLead ? [{ origin: "Official research lead", text: d.backlog.researchLead }] : []),
    ...d.sources.filter((s) => s.note && s.access !== "published-register").map((s) => ({ origin: `Source note: ${s.id}`, text: s.note as string })),
  ];

  const reviewerRecommendations = [
    ...(d.plan ? [{ origin: "Phase 4C.6 plan: current defensible position", text: d.plan.currentPosition }, { origin: "Phase 4C.6 plan: release gate", text: d.plan.releaseGate }] : []),
    ...d.proposals.filter((p) => p.reviewerNotes).map((p) => ({ origin: `Proposal ${p.id}: reviewer notes`, text: p.reviewerNotes as string })),
  ];

  const history: HistoryEvent[] = [];
  for (const s of d.sources) {
    history.push({ date: s.checked, event: `Source read: ${s.publisher} (${s.id})`, origin: s.access === "published-register" ? "Published source register" : "Phase 4C.3 research package" });
    if (s.sourceDate !== NOT_SHOWN) history.push({ date: s.sourceDate, event: `Date shown on source: ${s.id}`, origin: "Source" });
    if (s.metadataDate) history.push({ date: s.metadataDate.slice(0, 10), event: `File metadata date (not shown to readers): ${s.id}`, origin: "Source file metadata" });
  }
  if (d.proposals.length) history.push({ date: pkg.preparedOn, event: `Research proposal${d.proposals.length > 1 ? "s" : ""} prepared: ${d.proposals.map((p) => p.id).join(", ")}`, origin: "Phase 4C.3 research package" });
  if (d.plan) history.push({ date: planDate, event: `Listed in the evidence resolution plan as ${d.plan.priority}`, origin: "Phase 4C.6 resolution plan" });
  if (d.backlog) history.push({ date: null, event: `Listed in the verification backlog (rank ${d.backlog.rank}, ${d.backlog.priority})`, origin: "Phase 4C.4 backlog (no date recorded)" });
  const seen = new Set<string>();
  const dedup = history.filter((h) => {
    const k = `${h.date}|${h.event}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  dedup.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.event.localeCompare(b.event));
  // Undated events last.
  const historySorted = [...dedup.filter((h) => h.date), ...dedup.filter((h) => !h.date)];

  return {
    ...d,
    proposedCategory,
    priority,
    primarySource: primary ? { authority: primary.publisher, checked: primary.checked } : null,
    quality,
    outstandingQuestions,
    researcherNotes,
    reviewerRecommendations,
    history: historySorted,
  };
}

// ── Overview metrics ──

export type CountryStat = {
  code: string;
  name: string;
  /** Published records with this country as destination. */
  publishedAsDestination: number;
  /** Destinations verified for this passport, from the coverage report. */
  verifiedAsPassport: number;
  passportCoveragePercent: number | null;
  proposals: number;
  openCases: number;
  disputedCases: number;
};

export type WorkspaceOverview = {
  totalProposals: number;
  proposalsPending: number;
  proposalsDisputed: number;
  verifiedPublishedRecords: number;
  totalPairs: number;
  coveragePercent: number;
  rankingPublished: boolean;
  scoredPassports: number;
  requiredForRanking: number;
  cases: number;
  casesByStatus: Record<CaseStatus, number>;
  blockedByMissingEvidence: number;
  disputedCases: number;
  qualityErrors: number;
  qualityWarnings: number;
  proposalBlockers: number;
  proposalReviewFindings: number;
  countries: CountryStat[];
};

export const OPEN_STATUSES: CaseStatus[] = ["re-verification", "pending-verification", "disputed", "blocked", "not-verified"];

export function buildOverview(cases: ResearchCase[], input: Pick<WorkspaceInput, "pkg" | "published" | "proposalFindings" | "qualityIssues">, coverage: Pick<CoverageReport, "coverageShare" | "ranking" | "passports" | "universe">): WorkspaceOverview {
  const casesByStatus = Object.fromEntries((Object.keys(CASE_STATUS_LABEL) as CaseStatus[]).map((s) => [s, cases.filter((c) => c.status === s).length])) as Record<CaseStatus, number>;
  const countryCodes = [...new Set([...FOCUS_COUNTRIES, ...cases.flatMap((c) => [c.destination, ...(c.passport ? [c.passport] : [])])])];
  const destinationsPerPassport = coverage.universe.jurisdictions - 1;
  const countries: CountryStat[] = countryCodes.map((code) => {
    const p = coverage.passports.find((x) => x.code === code);
    const verifiedAsPassport = p ? p.verified + p["review-due"] : 0;
    const involved = cases.filter((c) => c.destination === code || c.passport === code);
    return {
      code,
      name: jName(code),
      publishedAsDestination: input.published.filter((r) => r.destination === code).length,
      verifiedAsPassport,
      passportCoveragePercent: p ? Math.round((verifiedAsPassport / destinationsPerPassport) * 1000) / 10 : null,
      proposals: input.pkg.proposals.filter((x) => x.destination === code || x.passport === code).length,
      openCases: involved.filter((c) => OPEN_STATUSES.includes(c.status)).length,
      disputedCases: involved.filter((c) => c.status === "disputed" || c.status === "re-verification").length,
    };
  });
  countries.sort((a, b) => focusRank({ destination: a.code }) - focusRank({ destination: b.code }) || b.openCases - a.openCases || a.name.localeCompare(b.name));
  return {
    totalProposals: input.pkg.proposals.length,
    proposalsPending: input.pkg.proposals.filter((p) => p.proposedVerification === "pending-verification").length,
    proposalsDisputed: input.pkg.proposals.filter((p) => p.proposedVerification === "disputed").length,
    verifiedPublishedRecords: input.published.length,
    totalPairs: coverage.universe.pairs,
    coveragePercent: Math.round(coverage.coverageShare * 10000) / 100,
    rankingPublished: coverage.ranking.published,
    scoredPassports: coverage.ranking.scoredPassports,
    requiredForRanking: coverage.ranking.required,
    cases: cases.length,
    casesByStatus,
    blockedByMissingEvidence: casesByStatus.blocked,
    disputedCases: casesByStatus.disputed + casesByStatus["re-verification"],
    qualityErrors: input.qualityIssues.filter((i) => i.severity === "error").length,
    qualityWarnings: input.qualityIssues.filter((i) => i.severity === "warning").length,
    proposalBlockers: input.proposalFindings.filter((f) => f.severity === "blocker").length,
    proposalReviewFindings: input.proposalFindings.filter((f) => f.severity === "review").length,
    countries,
  };
}

// ── Search, filters, pagination ──

export type WorkspaceQuery = { q: string; country: string; status: CaseStatus | ""; priority: string; quality: EvidenceQualityLevel | ""; page: number };
export const PAGE_SIZE = 25;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Parse untrusted search parameters into a safe query. Unknown values are dropped, never echoed. */
export function parseWorkspaceQuery(params: Record<string, string | string[] | undefined>): WorkspaceQuery {
  const q = one(params.q).slice(0, 80);
  const country = one(params.country).toUpperCase();
  const status = one(params.status) as CaseStatus;
  const quality = one(params.quality) as EvidenceQualityLevel;
  const priority = one(params.priority).toUpperCase();
  const page = Number.parseInt(one(params.page), 10);
  return {
    q,
    country: /^[A-Z]{2}$/.test(country) && getJurisdiction(country) ? country : "",
    status: status in CASE_STATUS_LABEL ? status : "",
    priority: /^P[0-3]$/.test(priority) || priority === "UNRANKED" ? priority : "",
    quality: quality in QUALITY_LABEL ? quality : "",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filterCases(cases: ResearchCase[], q: Omit<WorkspaceQuery, "page">): ResearchCase[] {
  const terms = norm(q.q).split(/\s+/).filter(Boolean);
  return cases.filter((c) => {
    if (q.country && c.passport !== q.country && c.destination !== q.country) return false;
    if (q.status && c.status !== q.status) return false;
    if (q.quality && c.quality !== q.quality) return false;
    if (q.priority && (q.priority === "UNRANKED" ? c.priority.label !== "Unranked" : c.priority.label !== q.priority)) return false;
    if (!terms.length) return true;
    const hay = norm(
      [
        c.id,
        c.title,
        c.passport ?? "",
        c.destination,
        c.passport ? jName(c.passport) : "",
        jName(c.destination),
        ...c.proposals.flatMap((p) => [p.id, p.proposedCategory, categoryMeta[p.proposedCategory].label]),
        ...c.published.flatMap((p) => [p.category, categoryMeta[p.category].label]),
        ...c.sources.map((s) => s.publisher),
        CASE_STATUS_LABEL[c.status],
      ].join(" "),
    );
    return terms.every((t) => hay.includes(t));
  });
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE): { items: T[]; page: number; pages: number; total: number } {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(1, page), pages);
  return { items: items.slice((p - 1) * size, p * size), page: p, pages, total: items.length };
}

/** Labels for display. A missing classification is "Not verified", never a guessed category. */
export const publishedLabel = (c: ResearchCase) => (c.published.length ? [...new Set(c.published.map((p) => categoryMeta[p.category].label))].join(" / ") : NOT_VERIFIED);
export const proposedLabel = (c: ResearchCase) => (c.proposedCategory === null ? "No proposal" : c.proposedCategory === "multiple" ? "Multiple proposals" : `${categoryMeta[c.proposedCategory].label} (proposed, not approved)`);

export { pairKey };
