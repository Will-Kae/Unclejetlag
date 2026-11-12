import { describe, expect, it } from "vitest";
import { releaseRevisionEligible, type ApprovedRevision } from "../src/lib/passport/release-revision-policy";
const approved: ApprovedRevision = {
  status: "approved", revision: 4, reviewedRevision: 3,
  decision: "approve", independentReviewer: true,
  reviewerActive: true, unresolvedConflict: false,
};
describe("Phase 4D.2 release revision proposal", () => {
  it("recognizes an approved submission whose review was of its preceding revision", () => {
    expect(releaseRevisionEligible(approved)).toBe(true);
  });
  it("blocks same-revision and stale approvals", () => {
    for (const reviewedRevision of [4, 2, 5, -1]) {
      expect(releaseRevisionEligible({ ...approved, reviewedRevision })).toBe(false);
    }
  });
  it("blocks unapproved states, non-approvals, self-review, inactive reviewer and conflicts", () => {
    expect(releaseRevisionEligible({ ...approved, status: "submitted" })).toBe(false);
    expect(releaseRevisionEligible({ ...approved, decision: "reject" })).toBe(false);
    expect(releaseRevisionEligible({ ...approved, independentReviewer: false })).toBe(false);
    expect(releaseRevisionEligible({ ...approved, reviewerActive: false })).toBe(false);
    expect(releaseRevisionEligible({ ...approved, unresolvedConflict: true })).toBe(false);
  });
  it("blocks invalid and overflowed revisions", () => {
    for (const revision of [0, 1, -1, 2.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(releaseRevisionEligible({ ...approved, revision })).toBe(false);
    }
  });
});
