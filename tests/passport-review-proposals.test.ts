import { describe, expect, it } from "vitest";
import { proposeEvidenceReview } from "../src/lib/passport/review-proposals";
import type { AccessRule, Source } from "../src/lib/passport/types";

const source: Source = {
  id: "official", title: "Official source", publisher: "Government",
  url: "https://example.gov", type: "government", checked: "2026-10-10",
};
const rule: AccessRule = {
  passport: "ZW", destination: "ZA", category: "visa-free",
  evidence: "Official exemption list", sourceId: "official",
  verification: "pending-verification", confidence: "high",
};
const proposal = {
  ruleId: "ZW-ZA-official", requestedStatus: "verified" as const,
  reviewerId: "reviewer-1", reason: "Checked official list",
  context: { date: "2026-10-14", process: "manual-review", ref: "review-123", source },
};

describe("review proposal audit", () => {
  it("proposes a valid transition with an audit entry without mutating input", () => {
    const result = proposeEvidenceReview(rule, proposal, 2);
    expect(result.proposedRule.verification).toBe("verified");
    expect(result.audit.revision.revision).toBe(3);
    expect(result.audit.from).toBe("pending-verification");
    expect(result.audit.reviewerId).toBe("reviewer-1");
    expect(rule.verification).toBe("pending-verification");
  });
  it("rejects missing reviewer identity and rationale", () => {
    expect(() => proposeEvidenceReview(rule, { ...proposal, reviewerId: "" })).toThrow();
    expect(() => proposeEvidenceReview(rule, { ...proposal, reason: "" })).toThrow();
  });
  it("rejects wrong rule IDs and disallowed transitions", () => {
    expect(() => proposeEvidenceReview(rule, { ...proposal, ruleId: "different" })).toThrow();
    expect(() => proposeEvidenceReview(rule, { ...proposal, requestedStatus: "superseded" })).toThrow();
  });
});
