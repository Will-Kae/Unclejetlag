import { describe, expect, it } from "vitest";
import { validateEditorialReview, type EditorialReviewInput } from "../src/lib/passport/editorial-review";

const base: EditorialReviewInput = {
  actor: { userId: "reviewer", role: "reviewer", active: true },
  ownerId: "researcher",
  status: "submitted",
  expectedRevision: 3,
  actualRevision: 3,
  decision: "approve",
  rationale: "Official evidence checked",
  sourceVerified: true,
  unresolvedConflicts: false,
};

describe("Phase 4D editorial review preflight", () => {
  it("returns an approval proposal without mutating the input", () => {
    expect(validateEditorialReview(base)).toEqual({
      nextStatus: "approved",
      nextRevision: 4,
      auditAction: "editorial-review:approve",
    });
    expect(base.status).toBe("submitted");
  });

  it("blocks inactive identities and self-review", () => {
    expect(() => validateEditorialReview({ ...base, actor: null })).toThrow("FORBIDDEN");
    expect(() => validateEditorialReview({ ...base, actor: { userId: "researcher", role: "admin", active: true } })).toThrow("FORBIDDEN");
    expect(() => validateEditorialReview({ ...base, actor: { userId: "reviewer", role: "reviewer", active: false } })).toThrow("FORBIDDEN");
    expect(() => validateEditorialReview({ ...base, actor: { userId: "other", role: "researcher", active: true } })).toThrow("FORBIDDEN");
  });

  it("blocks stale revisions", () => {
    for (const actualRevision of [2, -1, 3.5]) {
      expect(() => validateEditorialReview({ ...base, actualRevision })).toThrow("STALE_REVISION");
    }
  });

  it("blocks reviews of non-submitted states", () => {
    for (const status of ["draft", "approved", "changes_requested", "rejected"] as const) {
      expect(() => validateEditorialReview({ ...base, status })).toThrow("FORBIDDEN");
    }
  });

  it("requires rationale", () => {
    expect(() => validateEditorialReview({ ...base, rationale: " " })).toThrow("MISSING_RATIONALE");
  });

  it("blocks unsafe approval", () => {
    expect(() => validateEditorialReview({ ...base, sourceVerified: false })).toThrow("EVIDENCE_BLOCKED");
    expect(() => validateEditorialReview({ ...base, unresolvedConflicts: true })).toThrow("EVIDENCE_BLOCKED");
  });

  it("supports the existing database review decisions", () => {
    expect(validateEditorialReview({ ...base, decision: "request_changes", sourceVerified: false }).nextStatus).toBe("changes_requested");
    expect(validateEditorialReview({ ...base, decision: "reject", sourceVerified: false }).nextStatus).toBe("rejected");
  });
});
