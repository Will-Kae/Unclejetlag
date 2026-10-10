/**
 * Phase 2A: passport data integrity, provenance and verification.
 * Covers canonical identifiers, rule uniqueness and conflicts, source references, dates and freshness,
 * verification-state transitions, coverage, publication eligibility, ranking reproducibility,
 * unknown-versus-restricted semantics and source monitoring decisions.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ISO_ALPHA2 } from "@/lib/banking/iso-countries";
import { buildCoverageReport } from "@/lib/passport/coverage";
import { DATASET, policyChanges, ruleRecords, rules, sources } from "@/lib/passport/data";
import { accessFor, scorePassport } from "@/lib/passport/engine";
import { getJurisdiction, jurisdictions, SPECIAL_ENTRY_PAIRS, type Jurisdiction } from "@/lib/passport/jurisdictions";
import { methodologies } from "@/lib/passport/methodology";
import { evaluateCheck, MONITOR_POLICY, monitoringMode, normaliseForHash, planChecks, scheduleByHost, type SourceState } from "@/lib/passport/monitoring";
import { sourceLedger, toRuleRecord, verificationProcesses } from "@/lib/passport/provenance";
import type { AccessRule, Source } from "@/lib/passport/types";
import { validateDataset, validateRegistry } from "@/lib/passport/validation";
import {
  addDays, canTransition, detectConflicts, effectiveStatus, isIsoDate, publicationDecisions, publishableRules, reviewDueOn, ruleId, transition, TransitionError, TRANSITIONS, VERIFICATION_STATUSES,
} from "@/lib/passport/verification";
import { coverageReport, passportIndexSnapshot } from "./harness/passport";

const ROOT = path.resolve(__dirname, "..");
const ISO = new Set([...ISO_ALPHA2].filter((c) => c !== "XK"));
const src = (id: string, extra: Partial<Source> = {}): Source => ({ id, title: "t", publisher: "Immigration authority", url: `https://gov.example/${id}`, type: "government", authorityJurisdiction: "ZA", checked: "2026-10-01", ...extra });
const rule = (passport: string, destination: string, category: AccessRule["category"], extra: Partial<AccessRule> = {}): AccessRule => ({ passport, destination, category, evidence: "Listed on the official list", sourceId: "s1", verification: "verified", confidence: "high", ...extra });
const S = [src("s1"), src("s2", { type: "legislation" })];
const AS_OF = "2026-10-10";

describe("canonical jurisdiction registry", () => {
  it("passes every registry check", () => {
    expect(validateRegistry(jurisdictions, ISO)).toEqual([]);
  });
  it("keeps the 199-jurisdiction scope with unique codes, slugs, alpha-3 and numeric codes", () => {
    expect(jurisdictions).toHaveLength(199);
    for (const key of ["code", "slug"] as const) expect(new Set(jurisdictions.map((j) => j[key])).size).toBe(199);
    const a3 = jurisdictions.map((j) => j.alpha3).filter(Boolean);
    expect(a3).toHaveLength(198);
    expect(new Set(a3).size).toBe(198);
  });
  it("keeps every public slug, name and region exactly as published (Phase 1A snapshot)", () => {
    const snap = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/registry-snapshot.json"), "utf8")).passportJurisdictions as { code: string; slug: string; region: string }[];
    expect(jurisdictions.map((j) => ({ code: j.code, slug: j.slug, region: j.region })).sort((a, b) => a.code.localeCompare(b.code))).toEqual(snap.map(({ code, slug, region }) => ({ code, slug, region })));
  });
  it("does not derive names or slugs from the runtime's Intl data (URLs cannot drift with ICU)", () => {
    const file = fs.readFileSync(path.join(ROOT, "src/lib/passport/jurisdictions.ts"), "utf8");
    expect(file).not.toMatch(/DisplayNames/);
  });
  it("documents Kosovo as a user-assigned code with no ISO alpha-3 or numeric code", () => {
    const xk = getJurisdiction("XK")!;
    expect(xk.identifierScheme).toBe("user-assigned");
    expect(xk.alpha3).toBeNull();
    expect(xk.numeric).toBeNull();
    expect(xk.notes).toMatch(/user-assigned/);
  });
  it("records Taiwan with its ISO 3166-1 codes and a status note", () => {
    expect(getJurisdiction("TW")).toMatchObject({ identifierScheme: "iso-3166-1", alpha3: "TWN", numeric: "158", type: "partially-recognised" });
    expect(getJurisdiction("TW")!.notes).toBeTruthy();
  });
  it("treats Hong Kong and Macao as SARs of China, not sovereign states, with their own passports", () => {
    for (const [code, a3] of [["HK", "HKG"], ["MO", "MAC"]]) {
      const j = getJurisdiction(code)!;
      expect(j).toMatchObject({ type: "sar", sovereign: "CN", alpha3: a3, isPassportIssuer: true, isDestination: true });
      expect(j.notes).toMatch(/not a sovereign state/i);
    }
    expect(getJurisdiction("CN")!.sovereign).toBeUndefined();
  });
  it("flags mainland China–SAR–Taiwan travel as special-entry pairs", () => {
    const keys = SPECIAL_ENTRY_PAIRS.map((p) => `${p.passport}>${p.destination}`);
    for (const k of ["CN>HK", "CN>MO", "HK>CN", "MO>CN", "CN>TW", "TW>CN"]) expect(keys).toContain(k);
  });
  it("catches inconsistent identifiers, undocumented codes and duplicates", () => {
    const base = jurisdictions.slice(0, 3);
    const bad: Jurisdiction[] = [
      ...base,
      { ...base[0] },
      { ...base[1], code: "QZ", slug: "quizland", name: "Quizland", identifierScheme: "user-assigned", alpha3: null, numeric: null },
      { ...getJurisdiction("HK")!, sovereign: undefined },
      { ...base[2], code: "ZZ", slug: "wrong-slug" },
    ];
    const issues = validateRegistry(bad, ISO).join("\n");
    expect(issues).toMatch(/duplicate code: AF/);
    expect(issues).toMatch(/QZ: user-assigned code is not documented/);
    expect(issues).toMatch(/HK: SAR needs a sovereign/);
    expect(issues).toMatch(/ZZ: not an ISO 3166-1 alpha-2 code/);
    expect(issues).toMatch(/ZZ: slug wrong-slug does not match/);
  });
});

describe("dataset integrity and source references", () => {
  it("passes every dataset check at the dataset date", () => {
    expect(validateDataset(ruleRecords, sources, policyChanges, jurisdictions, DATASET.asOf)).toEqual([]);
  });
  it("has one record per pair and source, and no conflicting pairs", () => {
    expect(new Set(ruleRecords.map(ruleId)).size).toBe(ruleRecords.length);
    expect(detectConflicts(ruleRecords)).toEqual([]);
  });
  it("detects duplicates, missing sources, orphaned sources and lead-only citations", () => {
    const issues = validateDataset(
      [rule("ZW", "ZA", "visa-free"), rule("ZW", "ZA", "visa-free"), rule("ZW", "BW", "visa-free", { sourceId: "missing" }), rule("ZW", "NA", "visa-free", { additionalSourceIds: ["gone"] })],
      [src("s1"), src("orphan"), src("lead", { url: "https://en.wikipedia.org/wiki/Visa_requirements" })],
      [],
      jurisdictions,
      AS_OF,
    ).join("\n");
    expect(issues).toMatch(/duplicate rule ZW-ZA-s1/);
    expect(issues).toMatch(/source missing not registered/);
    expect(issues).toMatch(/supporting source gone not registered/);
    expect(issues).toMatch(/orphan: orphaned source/);
    expect(issues).toMatch(/lead: lead-only domain/);
  });
  it("rejects unknown jurisdictions, self pairs and 'unknown' stored as a rule", () => {
    const issues = validateDataset([rule("ZW", "ZW", "visa-free"), rule("XX", "ZA", "visa-free"), rule("ZW", "BW", "unknown")], S, [], jurisdictions, AS_OF).join("\n");
    expect(issues).toMatch(/same/);
    expect(issues).toMatch(/unknown passport XX/);
    expect(issues).toMatch(/absence of a rule/);
  });
  it("every source has an authority jurisdiction, an official tier and a ledger entry", () => {
    for (const s of sources) {
      expect(s.authorityJurisdiction, s.id).toBeTruthy();
      expect(sourceLedger[s.id], s.id).toBeDefined();
      expect(verificationProcesses[sourceLedger[s.id].process]).toBeDefined();
    }
  });
  it("cites only official sources (no commercial index, encyclopedia or agency)", () => {
    for (const s of sources) expect(s.url).not.toMatch(/wikipedia|henley|passportindex|visahq|ivisa|visaguide|timatic|atlys/i);
  });
});

describe("dates and freshness", () => {
  it("accepts only real ISO dates", () => {
    expect(isIsoDate("2026-10-10")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("10/10/2026")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
    expect(addDays("2026-10-10", 180)).toBe("2027-04-08");
  });
  it("makes a verified rule review-due exactly when the freshness window ends", () => {
    const s = src("s1", { checked: "2026-10-10" });
    expect(reviewDueOn(s)).toBe("2027-04-08");
    expect(effectiveStatus(rule("ZW", "ZA", "visa-free"), s, "2027-04-07")).toBe("verified");
    expect(effectiveStatus(rule("ZW", "ZA", "visa-free"), s, "2027-04-08")).toBe("review-due");
  });
  it("keeps review-due rules published but flagged (methodology v0.1: freshness is a flag)", () => {
    const d = publicationDecisions([rule("ZW", "ZA", "visa-free")], [src("s1", { checked: "2026-01-01" })], AS_OF)[0];
    expect(d).toMatchObject({ eligible: true, status: "review-due", reviewDue: true });
  });
  it("rejects invented or impossible dates on sources", () => {
    const issues = validateDataset([rule("ZW", "ZA", "visa-free")], [src("s1", { checked: "2026-12-01", sourceUpdated: "2026-12-05" })], [], jurisdictions, AS_OF).join("\n");
    expect(issues).toMatch(/after the dataset date/);
    expect(issues).toMatch(/after the date we read it/);
  });
  it("does not publish a rule before its effective date or after it ends", () => {
    const ds = publicationDecisions([rule("ZW", "ZA", "visa-free", { effectiveFrom: "2026-11-01" }), rule("ZW", "BW", "visa-free", { effectiveTo: "2026-10-01" })], S, AS_OF);
    expect(ds.map((d) => d.eligible)).toEqual([false, false]);
    expect(ds[0].reasons).toContain("not-yet-in-effect-or-expired");
  });
  it("records a source update date only where the source shows one", () => {
    const withoutDate = sources.filter((s) => !s.sourceUpdated).map((s) => s.id);
    expect(withoutDate).toHaveLength(13);
    for (const s of sources) if (s.sourceUpdated) expect(isIsoDate(s.sourceUpdated)).toBe(true);
  });
});

describe("verification-state transitions", () => {
  const ctx = { date: AS_OF, process: "review", ref: "test" };
  it("defines the lifecycle and keeps superseded and rejected terminal", () => {
    expect(VERIFICATION_STATUSES).toEqual(["discovered", "pending-verification", "verified", "review-due", "disputed", "superseded", "rejected"]);
    expect(TRANSITIONS.superseded).toEqual([]);
    expect(TRANSITIONS.rejected).toEqual([]);
    expect(canTransition("discovered", "verified")).toBe(false);
    expect(canTransition("pending-verification", "verified")).toBe(true);
  });
  it("verifies only against the rule's own official source, with evidence and a real check date", () => {
    const pending = rule("ZW", "ZA", "visa-free", { verification: "pending-verification" });
    expect(() => transition(pending, "verified", ctx)).toThrow(TransitionError);
    expect(() => transition(pending, "verified", { ...ctx, source: src("s2") })).toThrow(/does not match/);
    expect(() => transition(pending, "verified", { ...ctx, source: src("s1", { checked: "2026-12-01" }) })).toThrow(/check date/);
    expect(() => transition({ ...pending, evidence: "" }, "verified", { ...ctx, source: src("s1") })).toThrow(/evidence/);
    const ok = transition(pending, "verified", { ...ctx, source: src("s1") }, 1);
    expect(ok.rule.verification).toBe("verified");
    expect(ok.revision).toMatchObject({ revision: 2, status: "verified", action: "status-changed", process: "review", ref: "test" });
  });
  it("re-verification of a review-due rule is recorded as re-verified", () => {
    const r = transition(rule("ZW", "ZA", "visa-free", { verification: "review-due" }), "verified", { ...ctx, source: src("s1") });
    expect(r.revision.action).toBe("re-verified");
  });
  it("requires a replacement for superseded and a reason for rejected or disputed", () => {
    expect(() => transition(rule("ZW", "ZA", "visa-free"), "superseded", ctx)).toThrow(/replacing rule/);
    expect(transition(rule("ZW", "ZA", "visa-free"), "superseded", { ...ctx, supersededBy: "ZW-ZA-s2" }).rule.supersededBy).toBe("ZW-ZA-s2");
    expect(() => transition(rule("ZW", "ZA", "visa-free"), "disputed", ctx)).toThrow(/note/);
    expect(() => transition(rule("ZW", "ZA", "visa-free", { verification: "rejected" }), "verified", { ...ctx, source: src("s1") })).toThrow(/not allowed/);
  });
});

describe("publication eligibility", () => {
  it("publishes all 640 current records, unchanged and in order", () => {
    expect(ruleRecords).toHaveLength(640);
    expect(rules).toHaveLength(640);
    rules.forEach((r, i) => expect(r).toBe(ruleRecords[i]));
  });
  it("keeps unverified, disputed and withdrawn records out of published data", () => {
    const rs = (["discovered", "pending-verification", "disputed", "rejected"] as const).map((v, i) => rule("ZW", ["ZA", "BW", "NA", "ZM"][i], "visa-free", { verification: v }));
    const superseded = rule("ZW", "MW", "visa-free", { verification: "superseded", supersededBy: "x" });
    expect(publishableRules([...rs, superseded], S, AS_OF)).toEqual([]);
  });
  it("holds both sides of a conflict instead of picking the favourable answer", () => {
    const rs = [rule("ZW", "ZA", "visa-free"), rule("ZW", "ZA", "visa-required", { sourceId: "s2" })];
    expect(detectConflicts(rs)).toEqual([{ pair: "ZW>ZA", ruleIds: ["ZW-ZA-s1", "ZW-ZA-s2"], categories: ["visa-free", "visa-required"] }]);
    expect(publishableRules(rs, S, AS_OF)).toEqual([]);
    expect(accessFor("ZW", publishableRules(rs, S, AS_OF)).find((a) => a.destination === "ZA")?.category).toBe("unknown");
  });
  it("treats agreeing sources as corroboration and counts the destination once", () => {
    const rs = [rule("ZW", "ZA", "visa-free"), rule("ZW", "ZA", "visa-free", { sourceId: "s2" })];
    expect(detectConflicts(rs)).toEqual([]);
    const pub = publishableRules(rs, S, AS_OF);
    expect(pub).toHaveLength(2);
    expect(accessFor("ZW", pub).filter((a) => a.destination === "ZA")).toHaveLength(1);
    expect(scorePassport("ZW", pub).counts["visa-free"]).toBe(1);
  });
  it("lets an explicit override (e.g. a suspension) replace a standing rule without a conflict", () => {
    const rs = [rule("ZW", "US", "visa-required"), rule("ZW", "US", "restricted", { sourceId: "s2", overrides: ["ZW-US-s1"] })];
    expect(detectConflicts(rs)).toEqual([]);
    expect(publishableRules(rs, S, AS_OF).map((r) => r.category)).toEqual(["restricted"]);
  });
  it("never turns conditional access into unconditional visa-free access", () => {
    const conditional = rule("ZW", "GE", "conditional", { conditions: "Only with a valid visa or residence permit from a listed country." });
    const alone = scorePassport("ZW", publishableRules([conditional], S, AS_OF));
    expect(alone.counts.conditional).toBe(1);
    expect(alone.counts["visa-free"]).toBe(0);
    const withVf = [conditional, rule("ZW", "GE", "visa-free", { sourceId: "s2" })];
    expect(publishableRules(withVf, S, AS_OF)).toEqual([]);
    expect(validateDataset([rule("ZW", "GE", "conditional")], S, [], jurisdictions, AS_OF).join()).toMatch(/must state its conditions/);
  });
  it("keeps the real conditional route for Zimbabwe → Georgia as an e-visa, with the route in conditions", () => {
    const zwGe = rules.find((r) => r.passport === "ZW" && r.destination === "GE")!;
    expect(zwGe.category).toBe("evisa");
    expect(zwGe.conditions).toMatch(/residence permit/);
    expect(zwGe.additionalSourceIds).toEqual(["ge-visa-permit-list"]);
  });
  it("does not publish a special-entry pair without the permit explained", () => {
    const d = publicationDecisions([rule("CN", "HK", "visa-free")], S, AS_OF)[0];
    expect(d.eligible).toBe(false);
    expect(d.reasons).toContain("special-entry-pair-without-conditions");
  });
});

describe("unknown versus restricted", () => {
  it("never counts a pending record as a restriction", () => {
    const pub = publishableRules([rule("ZW", "ZA", "visa-required", { verification: "pending-verification" })], S, AS_OF);
    const s = scorePassport("ZW", pub);
    expect(s.counts["visa-required"]).toBe(0);
    expect(s.counts.unknown).toBe(198);
  });
  it("labels restrictions inferred from absence on an exhaustive list", () => {
    const absent = rules.filter((r) => r.evidenceBasis === "absent-from-list");
    expect(absent).toHaveLength(17);
    expect(absent.every((r) => ["visa-required", "evisa"].includes(r.category))).toBe(true);
  });
  it("reports unknown pairs as unknown in the coverage report, never as restricted", () => {
    const rep = buildCoverageReport([rule("ZW", "ZA", "visa-required")], S, { version: "t", asOf: AS_OF, methodology: "0.1" });
    expect(rep.totals.verified).toBe(1);
    expect(rep.totals.unknown).toBe(39402 - 1);
    expect(rep.pairs).toEqual([expect.objectContaining({ passport: "ZW", destination: "ZA", status: "verified", category: "visa-required" })]);
  });
});

describe("coverage report", () => {
  const rep = coverageReport();
  it("matches the committed report (run npm run passport:coverage after an approved data change)", () => {
    const committed = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/passport-coverage.json"), "utf8"));
    expect(committed).toEqual(JSON.parse(JSON.stringify(rep)));
  });
  it("accounts for every pair exactly once", () => {
    const { verified, disputed, pending, unknown } = rep.totals;
    expect(verified + rep.totals["review-due"] + disputed + pending + unknown).toBe(199 * 198);
    for (const p of rep.passports) expect(p.verified + p["review-due"] + p.disputed + p.pending + p.unknown).toBe(198);
    expect(rep.pairs).toHaveLength(640);
  });
  it("never claims complete worldwide coverage", () => {
    expect(rep.claims.completeWorldwideCoverage).toBe(false);
    expect(rep.claims.statement).toMatch(/unknown, not restricted/);
    expect(rep.ranking.published).toBe(false);
  });
  it("reports with the real counts from the dataset", () => {
    expect(rep.totals).toMatchObject({ verified: 640, "review-due": 0, disputed: 0, pending: 0, published: 640, records: 640 });
    expect(rep.passports.filter((p) => p.verified > 0)).toHaveLength(15);
    expect(rep.destinations.filter((d) => d.verified > 0)).toHaveLength(46);
    expect(rep.nextReviewDue).toBe("2027-03-23");
  });
});

describe("provenance records", () => {
  it("gives every published rule a complete, traceable record", () => {
    const sm = new Map(sources.map((s) => [s.id, s]));
    for (const r of rules) {
      const rec = toRuleRecord(r, sm.get(r.sourceId)!, DATASET.asOf);
      expect(rec.source.url).toMatch(/^https:\/\//);
      expect(rec.source.issuingAuthority).toBeTruthy();
      expect(rec.evidence.length).toBeGreaterThan(5);
      expect(isIsoDate(rec.dateChecked)).toBe(true);
      expect(rec.revisions.length).toBeGreaterThanOrEqual(1);
      expect(rec.revisions[0]).toMatchObject({ revision: 1, action: "created" });
      expect(["5860cd4", "15e3c1b"]).toContain(rec.revisions[0].ref);
      expect(rec.process).toMatch(/^uj-research-sprint-[12]$/);
    }
  });
  it("is honest that no rule has had an independent second review yet", () => {
    const sm = new Map(sources.map((s) => [s.id, s]));
    expect(rules.some((r) => toRuleRecord(r, sm.get(r.sourceId)!, DATASET.asOf).independentReview)).toBe(false);
  });
});

describe("ranking reproducibility", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/passport-index-snapshot.json"), "utf8"));
  it("reproduces every score, access map and the ranking gate for this dataset and methodology", () => {
    const now = JSON.parse(JSON.stringify(passportIndexSnapshot()));
    for (const k of ["methodology", "rankingStatus", "datasetStats", "scores", "access", "compareZWZA"]) expect(now[k], k).toEqual(fixture[k]);
  });
  it("keeps methodology versions, weights and thresholds unchanged", () => {
    expect(JSON.parse(JSON.stringify(methodologies))).toEqual(fixture.methodologies);
    expect(methodologies.map((m) => m.id)).toEqual(["0.1"]);
    expect(DATASET.methodology).toBe("0.1");
  });
  it("evaluates publication at the dataset date, which is not earlier than any evidence", () => {
    expect(sources.every((s) => s.checked <= DATASET.asOf)).toBe(true);
  });
});

describe("source monitoring decisions", () => {
  const state: SourceState = { sourceId: "s1", mode: "automated", lastHash: "a", lastOkAt: "2026-10-01T00:00:00Z", consecutiveFailures: 0 };
  it("turns a changed page into a review task, never a rule change", () => {
    const out = evaluateCheck(state, { sourceId: "s1", at: "2026-10-10T00:00:00Z", outcome: "changed", contentHash: "b", attempts: 1 }, ["ZW-ZA-s1"]);
    expect(out.task).toMatchObject({ kind: "content-changed", ruleIds: ["ZW-ZA-s1"] });
    expect(out.state.lastHash).toBe("b");
    expect(Object.keys(out)).not.toContain("rule");
    expect(out.events.map((e) => e.event)).toEqual(["check", "task-created"]);
  });
  it("records an unchanged check in the audit log only", () => {
    const out = evaluateCheck(state, { sourceId: "s1", at: "2026-10-10T00:00:00Z", outcome: "unchanged", contentHash: "a", attempts: 1 }, []);
    expect(out.task).toBeUndefined();
    expect(out.events).toHaveLength(1);
  });
  it("raises a source-unavailable task after repeated failures, without removing rules", () => {
    let s = { ...state };
    const tasks = [];
    for (let i = 0; i < 4; i++) {
      const out = evaluateCheck(s, { sourceId: "s1", at: `2026-10-1${i}T00:00:00Z`, outcome: "timeout", attempts: MONITOR_POLICY.retryBackoffMs.length }, ["ZW-ZA-s1"]);
      s = out.state;
      if (out.task) tasks.push(out.task.kind);
    }
    expect(tasks).toEqual(["source-unavailable"]);
    expect(s.consecutiveFailures).toBe(4);
  });
  it("switches to manual and never bypasses a refusal", () => {
    const out = evaluateCheck(state, { sourceId: "s1", at: "2026-10-10T00:00:00Z", outcome: "robots-disallowed", attempts: 1 }, []);
    expect(out.state.mode).toBe("manual");
    expect(out.task?.kind).toBe("manual-check-required");
  });
  it("plans only automated sources, respects the interval and spreads requests per host", () => {
    expect(planChecks([state, { ...state, sourceId: "s2", mode: "manual" }], "2026-10-05")).toEqual([]);
    expect(planChecks([state], "2026-10-08").map((s) => s.sourceId)).toEqual(["s1"]);
    const sched = scheduleByHost([1, 2, 3, 4, 5].map((i) => ({ sourceId: `s${i}`, url: `https://same.example/p${i}` })));
    expect(sched.map((s) => s.minute)).toEqual([0, 0, 1, 1, 2]);
  });
  it("ignores markup, scripts and clock text when hashing", () => {
    expect(normaliseForHash("<p>Visa  required</p><script>x=1</script> 10:42")).toBe(normaliseForHash("<div>visa required</div>"));
  });
  it("keeps every current source on manual checks until its terms are reviewed", () => {
    expect(sources.every((s) => monitoringMode(s) === "manual")).toBe(true);
  });
});
