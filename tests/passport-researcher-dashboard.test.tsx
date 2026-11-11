import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ResearcherDashboard } from "../src/components/passport/verification/ResearcherDashboard";

describe("passport researcher dashboard", () => {
  const summary = { drafts: 0, awaitingReview: 1, changesRequested: 0, approved: 0 };

  it("labels the preview as non-operational", () => {
    const html = renderToStaticMarkup(<ResearcherDashboard summary={summary} submissions={[]} preview />);
    expect(html).toContain("Preview only");
    expect(html).toContain("no evidence is saved");
    expect(html).toContain("My evidence submissions");
  });

  it("renders only the supplied authorized submissions", () => {
    const html = renderToStaticMarkup(<ResearcherDashboard summary={summary} submissions={[{
      id: "submission-1", ruleId: "AUS-GBR", passportCode: "AUS",
      destinationCode: "GBR", revision: 2, status: "submitted",
    }]} />);
    expect(html).toContain("AUS-GBR");
    expect(html).toContain("Awaiting review");
    expect(html).toContain("submitted");
  });
});
