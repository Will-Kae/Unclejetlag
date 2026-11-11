import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewerDashboard } from "../src/components/passport/verification/ReviewerDashboard";

const summary = { awaitingReview: 2, changesRequested: 0, reviewedByMe: 1, openConflicts: 0 };
const records = [
  { id: "one", ruleId: "AUS-GBR", passportCode: "AUS", destinationCode: "GBR", status: "submitted" as const, submitterId: "researcher-1", revision: 1, sourceUrl: "https://example.gov" },
  { id: "two", ruleId: "CAN-GBR", passportCode: "CAN", destinationCode: "GBR", status: "submitted" as const, submitterId: "reviewer-1", revision: 1, sourceUrl: "https://example.gov" },
];

describe("independent reviewer dashboard", () => {
  it("displays preview status and reviewer checklist", () => {
    const html = renderToStaticMarkup(<ReviewerDashboard reviewerId="reviewer-1" summary={summary} submissions={records} preview />);
    expect(html).toContain("Preview only");
    expect(html).toContain("Self-review is prohibited");
    expect(html).toContain("AUS-GBR");
  });
  it("filters out own submissions even in read-only preview", () => {
    const html = renderToStaticMarkup(<ReviewerDashboard reviewerId="reviewer-1" summary={summary} submissions={records} />);
    expect(html).not.toContain("CAN-GBR");
    expect(html).toContain("AUS-GBR");
  });
});
