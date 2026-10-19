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

/**
 * Evidence status of a research case. Assigned only from the evidence attached to the case (published
 * records, proposals and the official sources linked to it), never from the case being listed in the
 * resolution plan or the backlog. See `deriveStatus` for the exact rules, applied in order.
 */
export type CaseStatus = "published" | "re-verification" | "pending-verification" | "disputed" | "insufficient" | "unavailable";
export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  published: "Verified, published",
  "re-verification": "Published, awaiting re-verification",
  "pending-verification": "Pending human verification",
  disputed: "Disputed: contradictory evidence",
  insufficient: "Evidence available but insufficient",
  unavailable: EVIDENCE_UNAVAILABLE,
};
export const CASE_STATUS_DESCRIPTION: Record<CaseStatus, string> = {
  published: "A verified record is published and no open dispute or plan item questions it.",
  "re-verification": "A verified record is published, but a disputed proposal, a conflicting source or a resolution-plan item questions it. The published value is unchanged.",
  "pending-verification": "A proposal cites an official source that was read in full, with no recorded conflict. It awaits human review.",
  disputed: "Official sources or proposals contradict each other. No classification is chosen.",
  insufficient: "At least one official source was read, fully or partly, but it does not settle the classification.",
  unavailable: "No official source has been read for this case, or every linked source could not be read.",
};
/** Display order for statuses, from settled to least evidenced. */
export const CASE_STATUS_ORDER: CaseStatus[] = ["published", "re-verification", "pending-verification", "disputed", "insufficient", "unavailable"];

export type EvidenceQualityLevel = "blocker" | "review" | "clear" | "not-assessed";
export const QUALITY_LABEL: Record<EvidenceQualityLevel, string> = {
  blocker: "Blocker",
  review: "Needs review",
  clear: "No automated findings",
  "not-assessed": "Not assessed",
};

export type CaseSource = {
  id: string;
  /** published: cited by a published record; supporting/conflicting: cited by a proposal or link; context: read, but neither supports nor contradicts a classification. */
  role: "supporting" | "conflicting" | "context" | "published";
  /** Why the source is linked to this case, when the link comes from the evidence-link register. */
  linkReason: string | null;
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

/** A recorded link from an existing official source to a case (research/phase-4c7/evidence-links.ts). */
export type EvidenceLink = { caseIds: string[]; sourceId: string; role: "supporting" | "conflicting" | "context"; reason: string };

export type WorkspaceInput = {
  pkg: ResearchPackage;
  /** Official sources already read in earlier phases but not in the 4C.3 package (e.g. listed in the 4C.4 report). */
  supplementarySources?: ResearchSource[];
  evidenceLinks?: EvidenceLink[];
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

function fromResearchSource(s: ResearchSource, role: CaseSource["role"], linkReason: string | null = null): CaseSource {
  return {
    id: s.id,
    role,
    linkReason,
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

function fromPublishedSource(s: Source, role: CaseSource["role"], linkReason: string | null = null): CaseSource {
  return {
    id: s.id,
    role,
    linkReason,
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
  const researchSources = new Map([...pkg.sources, ...(input.supplementarySources ?? [])].map((s) => [s.id, s]));
  const publishedSources = new Map(sources.map((s) => [s.id, s]));
  const links = input.evidenceLinks ?? [];
  const sourceById = (id: string, role: CaseSource["role"], reason: string | null = null): CaseSource | null => {
    const r = researchSources.get(id);
    if (r) return fromResearchSource(r, role, reason);
    const p = publishedSources.get(id);
    return p ? fromPublishedSource(p, role, reason) : null;
  };
  /** Attach a source once per case; an id already attached in any role is not attached again. */
  const attach = (list: CaseSource[], id: string, role: CaseSource["role"], reason: string | null = null) => {
    if (list.some((s) => s.id === id)) return;
    const src = sourceById(id, role, reason);
    if (src) list.push(src);
  };
  const attachLinks = (list: CaseSource[], caseId: string) => {
    for (const l of links) if (l.caseIds.includes(caseId)) attach(list, l.sourceId, l.role, l.reason);
  };
  // Published classifications with category "unknown" are never treated as published.
  const isPublishedRecord = (r: AccessRule) => r.category !== "unknown";

  const pairKeys = new Set<string>();
  for (const p of pkg.proposals) pairKeys.add(`${p.passport}>${p.destination}`);
  for (const b of backlog) pairKeys.add(`${b.passport}>${b.destination}`);
  for (const e of plan) if (e.passport) pairKeys.add(`${e.passport}>${e.destination}`);

  const cases: ResearchCase[] = [];

  for (const key of [...pairKeys].sort()) {
    const [passport, destination] = key.split(">");
    const proposals = pkg.proposals.filter((p) => p.passport === passport && p.destination === destination);
    const pub = published.filter((r) => r.passport === passport && r.destination === destination && isPublishedRecord(r));
    const planEntry = plan.find((e) => e.passport === passport && e.destination === destination) ?? null;
    const backlogRow = backlog.find((b) => b.passport === passport && b.destination === destination) ?? null;
    const proposalIds = new Set(proposals.map((p) => p.id));
    const pubIds = new Set(pub.map(ruleId));
    const pubSourceIds = new Set(pub.flatMap((r) => [r.sourceId, ...(r.additionalSourceIds ?? [])]));

    const caseId = `pair-${passport.toLowerCase()}-${destination.toLowerCase()}`;
    const caseSources: CaseSource[] = [];
    for (const r of pub) {
      attach(caseSources, r.sourceId, "published");
      for (const extra of r.additionalSourceIds ?? []) attach(caseSources, extra, "published");
    }
    for (const p of proposals) {
      attach(caseSources, p.sourceId, "supporting");
      for (const id of p.supportingSourceIds ?? []) attach(caseSources, id, "supporting");
    }
    // Conflicting sources are attached even if already cited elsewhere for another proposal, so a contradiction is never hidden.
    for (const p of proposals) for (const id of p.conflictingSourceIds ?? []) if (!caseSources.some((s) => s.id === id && s.role === "conflicting")) {
      const src = sourceById(id, "conflicting");
      if (src) caseSources.push(src);
    }
    attachLinks(caseSources, caseId);
    // Research sources whose own record names this pair as relevant.
    for (const s of researchSources.values()) if (s.relevantPairs.includes(key)) attach(caseSources, s.id, "context", "The source record lists this pair as relevant.");

    const findings: CaseFinding[] = [
      ...input.proposalFindings.filter((f) => proposalIds.has(f.proposalId)).map((f) => ({ origin: "proposal-quality" as const, severity: f.severity, code: f.code, subject: f.proposalId, message: f.message })),
      ...input.qualityIssues.filter((i) => pubIds.has(i.subject) || pubSourceIds.has(i.subject) || i.subject === key).map((i) => ({ origin: "evidence-quality" as const, severity: i.severity, code: i.code, subject: i.subject, message: i.message })),
      ...input.researchIssues.filter((m) => proposals.some((p) => m.startsWith(`${p.id}:`))).map((m) => ({ origin: "research-validation" as const, severity: "error", code: "research-package", subject: m.split(":")[0], message: m })),
    ];

    const status = deriveStatus({
      published: pub.length > 0,
      underReview: !!planEntry,
      proposals,
      sources: caseSources,
      sourceAccess: (id) => researchSources.get(id)?.access ?? (publishedSources.has(id) ? "published-register" : undefined),
    });

    cases.push(
      finishCase({
        id: caseId,
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
    const id = e.id.replace(/^plan-/, "topic-");
    const topicSources: CaseSource[] = [];
    attachLinks(topicSources, id);
    cases.push(
      finishCase({
        id,
        kind: "topic",
        title: e.case,
        passport: null,
        destination: e.destination,
        published: [],
        proposals: [],
        // A topic has no published record; being in the plan does not make it blocked.
        status: deriveStatus({ published: false, underReview: true, proposals: [], sources: topicSources, sourceAccess: (sid) => researchSources.get(sid)?.access }),
        plan: e,
        backlog: null,
        relatedPairs,
        sources: topicSources,
        findings: [],
      }, pkg, planDate),
    );
  }

  return cases.sort((a, b) => a.priority.rank - b.priority.rank || focusRank(a) - focusRank(b) || a.title.localeCompare(b.title));
}

export type StatusEvidence = {
  published: boolean;
  /** Listed in the resolution plan: only relevant when a published record exists (re-verification). */
  underReview: boolean;
  proposals: Pick<EvidenceProposal, "proposedVerification" | "conflictingSourceIds" | "sourceId">[];
  sources: Pick<CaseSource, "role" | "access">[];
  sourceAccess: (sourceId: string) => CaseSource["access"] | undefined;
};

/**
 * The evidence-status rules, applied in order:
 * 1. published and (disputed proposal, conflicting source or plan item) → re-verification
 * 2. published → published
 * 3. disputed proposal or any conflicting source → disputed
 * 4. a proposal citing a source read in full (or a published-register source) → pending-verification
 * 5. any non-published source read in full or in part → insufficient
 * 6. otherwise (no source, or only unreadable sources) → unavailable
 * Being listed in the resolution plan or backlog never sets "insufficient" or "unavailable" by itself.
 */
export function deriveStatus(e: StatusEvidence): CaseStatus {
  const contradictory = e.proposals.some((p) => p.proposedVerification === "disputed" || (p.conflictingSourceIds?.length ?? 0) > 0) || e.sources.some((s) => s.role === "conflicting");
  if (e.published && (contradictory || e.underReview)) return "re-verification";
  if (e.published) return "published";
  if (contradictory) return "disputed";
  if (e.proposals.some((p) => { const a = e.sourceAccess(p.sourceId); return a === "read" || a === "published-register"; })) return "pending-verification";
  if (e.sources.some((s) => s.role !== "published" && (s.access === "read" || s.access === "partial"))) return "insufficient";
  return "unavailable";
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

  const primary = d.sources.find((s) => s.role === "supporting") ?? d.sources.find((s) => s.role === "published") ?? d.sources.find((s) => s.role === "context" && s.access !== "blocked") ?? null;

  const blockers = d.findings.some((f) => f.severity === "blocker" || f.severity === "error");
  const reviews = d.findings.length > 0;
  const quality: EvidenceQualityLevel = blockers ? "blocker" : reviews ? "review" : d.proposals.length || d.published.length ? "clear" : "not-assessed";
  // Note: quality reflects automated checks only; it never changes the evidence status.

  const outstandingQuestions = [
    ...(d.plan ? [`To close (Phase 4C.6 plan): ${d.plan.evidenceNeeded}`] : []),
    ...(d.backlog?.knownBlocker ? [`Known blocker (Phase 4C.4 backlog): ${d.backlog.knownBlocker}`] : []),
    ...d.proposals.filter((p) => p.conflicts).map((p) => `Unresolved conflict in ${p.id}: ${p.conflicts}`),
    ...(d.status === "unavailable" ? [`${EVIDENCE_UNAVAILABLE}: no readable official source is linked to this case yet.`] : []),
    ...(d.status === "insufficient" ? [`Evidence available but insufficient: ${d.sources.filter((s) => s.access === "read" || s.access === "partial").length} official source(s) read, none settles the classification.`] : []),
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
    history.push({ date: s.checked, event: `Source ${s.access === "blocked" ? "could not be read" : s.access === "partial" ? "partly read" : "read"}: ${s.publisher} (${s.id})`, origin: s.access === "published-register" ? "Published source register" : s.linkReason ? "Evidence-link register (Phase 4C.7)" : "Phase 4C.3 research package" });
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
  evidenceUnavailable: number;
  evidenceInsufficient: number;
  pendingHumanVerification: number;
  awaitingReverification: number;
  disputedCases: number;
  qualityErrors: number;
  qualityWarnings: number;
  proposalBlockers: number;
  proposalReviewFindings: number;
  countries: CountryStat[];
};

export const OPEN_STATUSES: CaseStatus[] = ["re-verification", "pending-verification", "disputed", "insufficient", "unavailable"];

export function buildOverview(cases: ResearchCase[], input: Pick<WorkspaceInput, "pkg" | "published" | "proposalFindings" | "qualityIssues">, coverage: Pick<CoverageReport, "coverageShare" | "ranking" | "passports" | "universe">): WorkspaceOverview {
  const casesByStatus = Object.fromEntries(CASE_STATUS_ORDER.map((s) => [s, cases.filter((c) => c.status === s).length])) as Record<CaseStatus, number>;
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
    evidenceUnavailable: casesByStatus.unavailable,
    evidenceInsufficient: casesByStatus.insufficient,
    pendingHumanVerification: casesByStatus["pending-verification"],
    awaitingReverification: casesByStatus["re-verification"],
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
export const publishedLabel = (c: ResearchCase) => {
  const known = c.published.filter((p) => p.category !== "unknown");
  return known.length ? [...new Set(known.map((p) => categoryMeta[p.category].label))].join(" / ") : NOT_VERIFIED;
};
export const proposedLabel = (c: Pick<ResearchCase, "proposedCategory">) =>
  c.proposedCategory === null ? "No proposal" : c.proposedCategory === "multiple" ? "Multiple proposals" : c.proposedCategory === "unknown" ? `${NOT_VERIFIED} (no proposed classification)` : `${categoryMeta[c.proposedCategory].label} (proposed, not approved)`;

export { pairKey };
