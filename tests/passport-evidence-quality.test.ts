/**
 * Phase 4C.4 evidence-quality safeguards.
 *
 * - The live dataset must have no evidence-quality errors.
 * - Warnings must match the reviewed baseline exactly: a new weakness fails, and so does a fixed one
 *   until the baseline is updated (`UPDATE_BASELINE=1 npx vitest run tests/passport-evidence-quality.test.ts`).
 * - Synthetic records prove each check fires.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { buildCoverageReport } from "@/lib/passport/coverage";
import { DATASET, ruleRecords, rules, sources } from "@/lib/passport/data";
import {
  OFFICIAL_PORTAL_HOSTS,
  auditEvidenceQuality,
  auditPublishedSet,
  findRequirementClaims,
  isOfficialHost,
  statedStayDays,
  unsupportedInsuranceClaims,
  type PageSource,
  type QualityIssue,
} from "@/lib/passport/evidence-quality";
import type { AccessRule, Source } from "@/lib/passport/types";
import { publishableRules } from "@/lib/passport/verification";

const AS_OF = "2026-10-10";
const BASELINE = path.resolve(__dirname, "fixtures/passport-evidence-quality-baseline.json");

const src = (over: Partial<Source> = {}): Source => ({ id: "s1", title: "List of visa-exempt countries", publisher: "Department of Immigration", url: "https://immigration.example.gov.zz/exempt", type: "government", authorityJurisdiction: "ZA", checked: AS_OF, ...over });
const rule = (over: Partial<AccessRule> = {}): AccessRule => ({ passport: "ZW", destination: "ZA", category: "visa-free", maxStayDays: 90, evidence: "Exempt for an intended stay of 90 days or less", sourceId: "s1", verification: "verified", confidence: "high", ...over });
const codes = (issues: QualityIssue[]) => issues.map((i) => `${i.severity}:${i.code}`);
const key = (i: QualityIssue) => `${i.severity}|${i.code}|${i.subject}`;

describe("live dataset", () => {
  const issues = auditEvidenceQuality(ruleRecords, sources, DATASET.asOf);

  it("has no evidence-quality errors", () => {
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("has exactly the reviewed baseline of warnings", () => {
    const current = [...new Set(issues.filter((i) => i.severity === "warning").map(key))].sort();
    if (process.env.UPDATE_BASELINE) fs.writeFileSync(BASELINE, JSON.stringify({ asOf: DATASET.asOf, warnings: current }, null, 2) + "\n");
    const baseline: string[] = JSON.parse(fs.readFileSync(BASELINE, "utf8")).warnings;
    expect(current.filter((w) => !baseline.includes(w)), "new warnings: fix them or review and add to the baseline").toEqual([]);
    expect(baseline.filter((w) => !current.includes(w)), "resolved warnings: remove them from the baseline").toEqual([]);
  });

  it("publishes only records that pass the gate", () => {
    expect(auditPublishedSet(rules, ruleRecords, sources, DATASET.asOf)).toEqual([]);
    for (const r of rules) expect(["verified", "review-due"]).toContain(r.verification);
  });

  it("keeps worldwide rankings unpublished below the threshold", () => {
    const report = buildCoverageReport(ruleRecords, sources, DATASET);
    expect(report.ranking.scoredPassports).toBeLessThan(report.ranking.required);
    expect(report.ranking.published).toBe(false);
  });
});

describe("conflicting classifications", () => {
  it("flags two publishable records for one pair with different categories", () => {
    const issues = auditEvidenceQuality([rule(), rule({ sourceId: "s2", category: "visa-on-arrival", evidence: "Visa on arrival for 90 days" })], [src(), src({ id: "s2" })], AS_OF);
    expect(codes(issues)).toContain("error:conflicting-classification");
  });

  it("does not flag a declared override", () => {
    const base = rule();
    const issues = auditEvidenceQuality([base, rule({ sourceId: "s2", category: "restricted", maxStayDays: undefined, evidence: "Suspended", overrides: ["ZW-ZA-s1"] })], [src(), src({ id: "s2" })], AS_OF);
    expect(codes(issues)).not.toContain("error:conflicting-classification");
  });
});

describe("expired or outdated evidence", () => {
  it("warns when a source passes the freshness window and errors at twice the window", () => {
    expect(codes(auditEvidenceQuality([rule()], [src({ checked: "2026-03-01" })], AS_OF))).toContain("warning:evidence-review-due");
    expect(codes(auditEvidenceQuality([rule()], [src({ checked: "2025-09-01" })], AS_OF))).toContain("error:evidence-expired");
  });

  it("warns on an old source document and errors on a check date in the future", () => {
    expect(codes(auditEvidenceQuality([rule()], [src({ sourceUpdated: "2019-01-01" })], AS_OF))).toContain("warning:source-document-old");
    expect(codes(auditEvidenceQuality([rule()], [src({ checked: "2026-12-01" })], AS_OF))).toContain("error:source-check-in-future");
  });
});

describe("missing or unofficial sources", () => {
  it("flags an unknown source id, an unknown additional source, a commercial index and plain http", () => {
    expect(codes(auditEvidenceQuality([rule({ sourceId: "nope" })], [src()], AS_OF))).toContain("error:source-missing");
    expect(codes(auditEvidenceQuality([rule({ additionalSourceIds: ["nope"] })], [src()], AS_OF))).toContain("error:source-missing");
    expect(codes(auditEvidenceQuality([rule()], [src({ url: "https://www.passportindex.org/x" })], AS_OF))).toContain("error:source-not-official");
    expect(codes(auditEvidenceQuality([rule()], [src({ url: "http://immigration.example.gov.zz" })], AS_OF))).toContain("error:source-not-https");
  });

  it("drops records with a missing source at the publication gate", () => {
    expect(publishableRules([rule({ sourceId: "nope" })], [src()], AS_OF)).toEqual([]);
  });
});

describe("diplomatic exemptions", () => {
  it("errors when diplomatic or official-passport evidence backs ordinary access", () => {
    for (const evidence of ["Exempt for holders of diplomatic and official passports", "Ghana (Diplomatic and Official only)", "Holders of diplomatic, official/service passports"]) {
      expect(codes(auditEvidenceQuality([rule({ evidence })], [src()], AS_OF))).toContain("error:diplomatic-exemption-on-ordinary-record");
    }
  });

  it("accepts evidence that names all passports, and visa-required records", () => {
    expect(codes(auditEvidenceQuality([rule({ evidence: "Exempted from visa requirement for holders of all passports, 90 days" })], [src()], AS_OF))).not.toContain(
      "error:diplomatic-exemption-on-ordinary-record",
    );
    expect(codes(auditEvidenceQuality([rule({ category: "visa-required", maxStayDays: undefined, evidence: "Exemption applies to diplomatic passports only" })], [src()], AS_OF))).not.toContain(
      "error:diplomatic-exemption-on-ordinary-record",
    );
  });
});

describe("stay durations", () => {
  it("reads stay periods written in several ways", () => {
    expect(statedStayDays("for a period not exceeding ninety (90) days")).toEqual([90]);
    expect(statedStayDays("a Visitor's Pass not exceeding three months (six months for EAC)").sort()).toEqual([180, 90]);
    expect(statedStayDays("30-day stay, renewable")).toEqual([30]);
    expect(statedStayDays(undefined)).toEqual([]);
  });

  it("errors when maxStayDays contradicts the evidence", () => {
    expect(codes(auditEvidenceQuality([rule({ maxStayDays: 30 })], [src()], AS_OF))).toContain("error:stay-duration-contradiction");
  });

  it("warns when only the conditions mention a different figure, or when no stay is recorded", () => {
    expect(codes(auditEvidenceQuality([rule({ maxStayDays: 30, evidence: "Listed", conditions: "Permit holders may stay 90 days" })], [src()], AS_OF))).toContain("warning:stay-duration-contradiction");
    expect(codes(auditEvidenceQuality([rule({ maxStayDays: undefined, evidence: "Listed as exempt" })], [src()], AS_OF))).toContain("warning:stay-duration-missing");
  });
});

describe("duplicates", () => {
  it("errors on the same passport, destination and source twice", () => {
    expect(codes(auditEvidenceQuality([rule(), rule()], [src()], AS_OF))).toContain("error:duplicate-record");
  });

  it("warns on two live records for one pair that agree", () => {
    expect(codes(auditEvidenceQuality([rule(), rule({ sourceId: "s2" })], [src(), src({ id: "s2" })], AS_OF))).toContain("warning:duplicate-pair");
  });
});

describe("unsupported entry-requirement claims", () => {
  it("errors on an insurance or vaccination condition no source states", () => {
    expect(codes(auditEvidenceQuality([rule({ conditions: "Mandatory travel insurance on arrival." })], [src()], AS_OF))).toContain("error:unsupported-requirement-claim");
    expect(codes(auditEvidenceQuality([rule({ conditions: "Yellow fever certificate required." })], [src()], AS_OF))).toContain("error:unsupported-requirement-claim");
  });

  it("accepts a condition the source's note supports", () => {
    expect(codes(auditEvidenceQuality([rule({ conditions: "Mandatory travel insurance on arrival." })], [src({ note: "Inbound travel insurance is mandatory for visitors." })], AS_OF))).not.toContain(
      "error:unsupported-requirement-claim",
    );
  });

  it("warns on fee, ticket or funds conditions with no support", () => {
    expect(codes(auditEvidenceQuality([rule({ conditions: "Return ticket and funds required." })], [src()], AS_OF))).toContain("warning:unsupported-requirement-claim");
  });
});

describe("attempts to publish disputed or unverified records", () => {
  for (const verification of ["disputed", "pending-verification", "discovered", "rejected", "superseded"] as const) {
    it(`keeps a ${verification} record out of the published set`, () => {
      const r = rule({ verification });
      expect(publishableRules([r], [src()], AS_OF)).toEqual([]);
      expect(codes(auditPublishedSet([r], [r], [src()], AS_OF))).toContain("error:unpublishable-record-published");
    });
  }

  it("rejects a published record in an unresolved conflict or missing from the dataset", () => {
    const a = rule();
    const b = rule({ sourceId: "s2", category: "visa-required", maxStayDays: undefined, evidence: "Not listed" });
    expect(codes(auditPublishedSet([a], [a, b], [src(), src({ id: "s2" })], AS_OF))).toContain("error:unpublishable-record-published");
    expect(codes(auditPublishedSet([a], [], [src()], AS_OF))).toContain("error:unpublishable-record-published");
  });
});

describe("content pages: insurance and health requirement claims", () => {
  const dir = path.resolve(__dirname, "../content/destinations");
  const pages = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  const read = (f: string) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    return { content, sources: ((data.sources ?? []) as PageSource[]).filter((s) => s?.url) };
  };

  /**
   * Reviewed pages whose insurance claim has no official insurance source. Remove an entry once the
   * page cites the government or state portal; never add one without a review note in the report.
   */
  const KNOWN_UNSUPPORTED = ["georgia.mdx"];

  it("lists exactly the reviewed pages with unsupported insurance claims", () => {
    const flagged = pages.filter((f) => {
      const { content, sources: s } = read(f);
      return unsupportedInsuranceClaims(findRequirementClaims(f, content), s).length > 0;
    });
    expect(flagged.sort()).toEqual(KNOWN_UNSUPPORTED);
  });

  it("only counts government domains and confirmed state portals as official", () => {
    expect(isOfficialHost("https://www.immigration.go.tz/x")).toBe(true);
    expect(isOfficialHost("https://inbound.nicinsurance.co.tz/apply")).toBe(true);
    expect(isOfficialHost("https://www.irao.ge/en/georgia-mandatory-travel-insurance-law/")).toBe(false);
    expect(isOfficialHost("https://www.clydeco.com/en/insights/2026/09/introduction-of-inbound-travel-insurance")).toBe(false);
    expect(Object.keys(OFFICIAL_PORTAL_HOSTS)).toEqual(["inbound.nicinsurance.co.tz"]);
  });

  it("flags a page whose only insurance source is an insurer or law firm", () => {
    const claims = findRequirementClaims("x.mdx", "Visitors must hold travel insurance from 1 May. Enjoy the beaches.");
    expect(claims).toHaveLength(1);
    expect(unsupportedInsuranceClaims(claims, [{ title: "Travel insurance law", url: "https://www.example-insurer.com/law" }])).toHaveLength(1);
    expect(unsupportedInsuranceClaims(claims, [{ title: "Mandatory inbound travel insurance", url: "https://inbound.nicinsurance.co.tz/apply" }])).toHaveLength(0);
  });
});

describe("Phase 4C.4 verification backlog", () => {
  const file = path.resolve(__dirname, "../research/phase-4c4/Phase-4C4-Verification-Backlog.csv");
  const parse = (line: string) => [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].map((m) => m[1].replace(/^"|"$/g, "").replace(/""/g, '"')).slice(0, -1);
  const [header, ...lines] = fs.readFileSync(file, "utf8").trim().split("\n");
  const cols = parse(header);
  const rows = lines.map((l) => Object.fromEntries(parse(l).map((v, i) => [cols[i], v])));
  const published = new Map(rules.map((r) => [`${r.passport}>${r.destination}`, r.category]));

  it("lists 50 distinct African passport–destination pairs in rank order", async () => {
    const { getJurisdiction } = await import("@/lib/passport/jurisdictions");
    expect(rows).toHaveLength(50);
    expect(new Set(rows.map((r) => `${r.passport}>${r.destination}`)).size).toBe(50);
    rows.forEach((r, i) => {
      expect(Number(r.rank)).toBe(i + 1);
      expect(getJurisdiction(r.passport)?.region).toBe("africa");
      expect(getJurisdiction(r.destination)?.region).toBe("africa");
      expect(getJurisdiction(r.passport)?.alpha3).toBe(r.passport_alpha3);
      expect(getJurisdiction(r.destination)?.alpha3).toBe(r.destination_alpha3);
      expect(r.official_research_lead).toMatch(/https:\/\/|Ministry|commission/i);
    });
  });

  it("never assigns a classification to an unverified pair, and matches published ones exactly", () => {
    for (const r of rows) {
      const pub = published.get(`${r.passport}>${r.destination}`);
      if (pub) {
        expect(r.current_status).toMatch(/^verified-published/);
        expect(r.classification).toBe(`Published ${pub}; unchanged pending human review`);
      } else {
        expect(r.current_status).toMatch(/^not verified/);
        expect(r.classification).toBe("UNASSIGNED - research required");
      }
    }
  });
});
