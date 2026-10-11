import { describe, expect, it } from "vitest";
import { evidenceReviewSchema, evidenceSubmissionSchema } from "../src/lib/passport/verification/validation";

const valid = {
  ruleId: "AUS-GBR", passportCode: "AUS", destinationCode: "GBR",
  proposedAccess: "visa_free", sourceId: "gov-1",
  sourceUrl: "https://example.gov/visas", observedAt: "2026-10-11T12:00:00Z",
  rationale: "Official entry requirements confirmed on the government website.",
  aiAssisted: false,
};

describe("passport verification input validation", () => {
  it("accepts complete evidence", () => {
    expect(evidenceSubmissionSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects non-HTTPS and malformed codes", () => {
    expect(evidenceSubmissionSchema.safeParse({ ...valid, sourceUrl: "http://example.gov" }).success).toBe(false);
    expect(evidenceSubmissionSchema.safeParse({ ...valid, passportCode: "au" }).success).toBe(false);
  });
  it("rejects empty rationale and unexpected properties", () => {
    expect(evidenceSubmissionSchema.safeParse({ ...valid, rationale: "short" }).success).toBe(false);
    expect(evidenceSubmissionSchema.safeParse({ ...valid, submitterId: "attacker" }).success).toBe(false);
  });
  it("requires revision and reason for a review", () => {
    expect(evidenceReviewSchema.safeParse({
      submissionId: "2cf77b2d-2746-45a2-8baf-5c60c45d78e4",
      revision: 1, decision: "approve", rationale: "Official evidence matches the current published guidance.",
    }).success).toBe(true);
    expect(evidenceReviewSchema.safeParse({
      submissionId: "2cf77b2d-2746-45a2-8baf-5c60c45d78e4",
      revision: 0, decision: "approve", rationale: "ok",
    }).success).toBe(false);
  });
});
