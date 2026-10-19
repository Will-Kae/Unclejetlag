import { describe, expect, it } from "vitest";
import { validateEditorialReview, type EditorialReviewInput } from "../src/lib/passport/editorial-review";
const base: EditorialReviewInput = {
  actor: { userId: "reviewer", role: "reviewer", active: true },
  ownerId: "researcher", status: "submitted", expectedRevision: 3, actualRevision: 3,
  decision: "approve", rationale: "Checked official evidence", sourceVerified: true, unresolvedConflicts: false,
};
describe("Phase 4D editorial preflight (no persistence)", () => {
  it("permits independent evidence approval without publication", () => {
    expect(validateEditorialReview(base)).toEqual({ nextStatus: "approved", nextRevision: 4, auditAction: "editorial-review:approve" });
    expect(base.status).toBe("submitted");
  });
  it("denies unauthenticated, inactive, researcher and self-review", () => {
    for (const actor of [null, { ...base.actor!, active: false }, { userId: "other", role: "researcher" as const, active: true }, { userId: "researcher", role: "admin" as const, active: true }]) {
      expect(() => validateEditorialReview({ ...base, actor })).toThrow("FORBIDDEN");
    }
  });
  it("denies stale and invalid revisions", () => {
    for (const actualRevision of [2, -1, 3.5]) expect(() => validateEditorialReview({ ...base, actualRevision })).toThrow("STALE_REVISION");
  });
  it("denies invalid states", () => {
    for (const status of ["draft", "approved", "disputed", "changes_requested", "rejected"] as const)
      expect(() => validateEditorialReview({ ...base, status })).toThrow();
  });
  it("requires rationale for every decision", () => {
    expect(() => validateEditorialReview({ ...base, rationale: "  " })).toThrow("MISSING_RATIONALE");
  });
  it("blocks approval without checked evidence or with unresolved disputes", () => {
    expect(() => validateEditorialReview({ ...base, sourceVerified: false })).toThrow("EVIDENCE_BLOCKED");
    expect(() => validateEditorialReview({ ...base, unresolvedConflicts: true })).toThrow("EVIDENCE_BLOCKED");
  });
  it("allows reviewer to request changes, reject or dispute with rationale", () => {
    for (const [decision, nextStatus] of [["request-changes", "changes_requested"], ["reject", "rejected"], ["dispute", "disputed"]] as const) {
      expect(validateEditorialReview({ ...base, decision, sourceVerified: false }).nextStatus).toBe(nextStatus);
    }
  });
});
