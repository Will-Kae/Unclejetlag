import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminDashboard } from "../src/components/passport/verification/AdminDashboard";

const summary = { activeResearchers: 2, activeReviewers: 1, pendingEvidence: 4, openConflicts: 1, releaseCandidates: 1 };

describe("passport verification admin dashboard", () => {
  it("renders a non-operational preview with safeguards", () => {
    const html = renderToStaticMarkup(<AdminDashboard summary={summary} audit={[]} releases={[]} preview />);
    expect(html).toContain("Preview only");
    expect(html).toContain("independent reviewers");
    expect(html).toContain("No release candidates loaded");
  });

  it("shows supplied release and audit records without action controls", () => {
    const html = renderToStaticMarkup(<AdminDashboard summary={summary} preview
      releases={[{ id: "r1", label: "October evidence batch", evidenceCount: 2, status: "withdrawn" }]}
      audit={[{ id: "a1", eventType: "evidence_submitted", actorLabel: "researcher", occurredAt: "2026-10-11T12:00:00Z" }]} />);
    expect(html).toContain("October evidence batch");
    expect(html).toContain("evidence_submitted");
    expect(html).not.toContain("<button");
  });
});
