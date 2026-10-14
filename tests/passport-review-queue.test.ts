import { describe, expect, it } from "vitest";
import { buildReviewQueue } from "../src/lib/passport/review-queue";
import type { CoverageReport } from "../src/lib/passport/coverage";

const report = {
  dataset: { version: "test", asOf: "2026-10-14", methodology: "0.1" },
  sources: [
    { id: "overdue", reviewDueOn: "2026-10-01" },
    { id: "soon", reviewDueOn: "2026-10-30" },
    { id: "later", reviewDueOn: "2027-01-01" },
  ],
  conflicts: [{ pair: "ZW>ZA", ruleIds: ["a", "b"], categories: ["visa-free", "visa-required"] }],
  pairs: [
    { passport: "ZW", destination: "ZA", status: "disputed", sourceIds: ["a", "b"] },
    { passport: "ZA", destination: "ZW", status: "pending", sourceIds: ["c"] },
  ],
} as unknown as Pick<CoverageReport, "dataset" | "sources" | "conflicts" | "pairs">;

describe("evidence review queue", () => {
  it("prioritises conflicts, overdue sources, then upcoming and pending tasks", () => {
    const queue = buildReviewQueue(report);
    expect(queue.map((task) => task.id)).toEqual([
      "conflict:ZW>ZA", "source:overdue", "source:soon", "pair:ZA>ZW",
    ]);
    expect(queue[0].priority).toBe("critical");
    expect(queue[1].priority).toBe("high");
  });
  it("uses dataset asOf instead of wall clock and excludes distant reviews", () => {
    expect(buildReviewQueue(report, 0).map((task) => task.id)).not.toContain("source:soon");
    expect(buildReviewQueue(report, 30).map((task) => task.id)).toContain("source:soon");
  });
  it("rejects invalid windows and dates", () => {
    expect(() => buildReviewQueue(report, -1)).toThrow(RangeError);
    expect(() => buildReviewQueue(report, 1.5)).toThrow(RangeError);
    expect(() => buildReviewQueue({ ...report, dataset: { ...report.dataset, asOf: "2026-02-30" } })).toThrow(RangeError);
  });
});
