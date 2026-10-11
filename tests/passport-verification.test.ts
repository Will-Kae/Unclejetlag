import { describe, expect, it } from "vitest";
import { canEnterReleaseCandidate, canReview, nextSubmissionStatus } from "../src/lib/passport/verification/workflow";

const submission = { id: "rule-1", submitterId: "alice", status: "submitted" as const, revision: 2 };
const reviewer = { id: "bob", role: "reviewer" as const, active: true };

describe("independent passport verification", () => {
  it("requires a distinct, active reviewer", () => {
    expect(canReview(submission, reviewer)).toBe(true);
    expect(canReview(submission, { ...reviewer, id: "alice" })).toBe(false);
    expect(canReview(submission, { ...reviewer, active: false })).toBe(false);
    expect(canReview(submission, { ...reviewer, role: "researcher" })).toBe(false);
    expect(canReview({ ...submission, status: "draft" }, reviewer)).toBe(false);
  });

  it("never allows submitter approval, including admin submitters", () => {
    expect(() => nextSubmissionStatus(submission, { id: "alice", role: "admin", active: true }, "approve")).toThrow();
    expect(nextSubmissionStatus(submission, reviewer, "approve")).toBe("approved");
    expect(nextSubmissionStatus(submission, reviewer, "reject")).toBe("rejected");
    expect(nextSubmissionStatus(submission, reviewer, "request_changes")).toBe("changes_requested");
  });

  it("blocks release without a current independent approval or with open conflicts", () => {
    const approved = { ...submission, status: "approved" as const };
    const review = { reviewerId: "bob", revision: 2, decision: "approve" as const };
    expect(canEnterReleaseCandidate(approved, [review], 0)).toBe(true);
    expect(canEnterReleaseCandidate(submission, [review], 0)).toBe(false);
    expect(canEnterReleaseCandidate(approved, [review], 1)).toBe(false);
    expect(canEnterReleaseCandidate(approved, [{ ...review, reviewerId: "alice" }], 0)).toBe(false);
    expect(canEnterReleaseCandidate(approved, [{ ...review, revision: 1 }], 0)).toBe(false);
    expect(canEnterReleaseCandidate(approved, [{ ...review, decision: "reject" }], 0)).toBe(false);
  });
});
