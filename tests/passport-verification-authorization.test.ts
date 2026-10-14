import { describe, expect, it } from "vitest";
import {
  canEnterReleaseCandidate,
  canReview,
  nextSubmissionStatus,
} from "../src/lib/passport/verification/workflow";

/**
 * Phase 2B-B authorization regression tests.
 * These tests are pure domain checks, not database/RLS integration tests.
 */
describe("verification authorization edge cases", () => {
  const submission = { id: "S-1", submitterId: "author", status: "submitted" as const, revision: 1 };

  it("blocks a disabled administrator from reviewing", () => {
    expect(canReview(submission, { id: "admin", role: "admin", active: false })).toBe(false);
  });

  it("blocks a submitter who is also an administrator", () => {
    expect(() => nextSubmissionStatus(
      submission,
      { id: "author", role: "admin", active: true },
      "approve",
    )).toThrow("Independent active reviewer required");
  });

  it("requires an approval for the exact current revision", () => {
    const approved = { ...submission, status: "approved" as const, revision: 3 };
    expect(canEnterReleaseCandidate(approved, [
      { reviewerId: "reviewer", decision: "approve", revision: 2 },
    ], 0)).toBe(false);
    expect(canEnterReleaseCandidate(approved, [
      { reviewerId: "reviewer", decision: "approve", revision: 3 },
    ], 0)).toBe(true);
  });

  it("does not release when an independent reviewer rejects", () => {
    const approved = { ...submission, status: "approved" as const };
    expect(canEnterReleaseCandidate(approved, [
      { reviewerId: "reviewer", decision: "reject", revision: 1 },
    ], 0)).toBe(false);
  });
});
