import { describe, expect, it } from "vitest";
import { toDatabaseFields } from "../../src/lib/passport/verification/mutation-validation";

const base = {
  sourceId: "official-government-source",
  sourceUrl: "https://example.gov/visas",
  observedAt: "2026-10-12T12:00:00Z",
  rationale: "Verified against official published immigration requirements.",
  aiAssisted: false,
};
const submit = {
  ...base, ruleId: "rule-1", passportCode: "AUS",
  destinationCode: "ZAF", access: "visa_free",
};
const review = {
  submissionId: "00000000-0000-4000-8000-000000000001",
  revision: 1, decision: "request_changes",
  rationale: "Please provide a current official government reference.",
};
describe("passport mutation validation", () => {
  it("maps valid submission to exact RPC keys", () => {
    expect(toDatabaseFields("submit", submit)).toEqual({
      p_rule_id: "rule-1", p_passport_code: "AUS",
      p_destination_code: "ZAF", p_access: "visa_free",
      p_source_id: base.sourceId, p_source_url: base.sourceUrl,
      p_observed_at: base.observedAt, p_rationale: base.rationale,
      p_ai_assisted: false,
    });
  });
  it("rejects caller-supplied actor and extra fields", () => {
    expect(() => toDatabaseFields("submit", { ...submit, p_actor: "attacker" })).toThrow();
  });
  it("rejects non-HTTPS and embedded credentials", () => {
    expect(() => toDatabaseFields("submit", { ...submit, sourceUrl: "http://example.gov" })).toThrow();
    expect(() => toDatabaseFields("submit", { ...submit, sourceUrl: "https://a:b@example.gov" })).toThrow();
  });
  it("rejects short rationale and invalid passport codes", () => {
    expect(() => toDatabaseFields("submit", { ...submit, rationale: "yes" })).toThrow();
    expect(() => toDatabaseFields("submit", { ...submit, passportCode: "AU" })).toThrow();
  });
  it("accepts valid review and rejects unknown decisions", () => {
    expect(toDatabaseFields("review", review).p_decision).toBe("request_changes");
    expect(() => toDatabaseFields("review", { ...review, decision: "publish" })).toThrow();
  });
  it("rejects invalid and stale-shaped revision values", () => {
    expect(() => toDatabaseFields("review", { ...review, revision: 0 })).toThrow();
    expect(() => toDatabaseFields("review", { ...review, revision: 1.5 })).toThrow();
  });
  it("validates resubmission and maps expected revision", () => {
    const result = toDatabaseFields("resubmit", {
      ...base, submissionId: review.submissionId, expectedRevision: 2,
    });
    expect(result.p_expected_revision).toBe(2);
    expect(result).not.toHaveProperty("p_actor");
  });
});
