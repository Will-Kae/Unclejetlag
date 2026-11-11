import { describe, expect, it } from "vitest";
import { isAuthorized } from "../src/lib/passport/verification/authorization";

describe("passport verification roles", () => {
  it("denies unauthenticated access", () => {
    expect(isAuthorized(null, "submit_evidence")).toBe(false);
    expect(isAuthorized(null, "prepare_release")).toBe(false);
  });
  it("limits researchers to evidence submission", () => {
    const researcher = { userId: "researcher", role: "researcher" as const };
    expect(isAuthorized(researcher, "submit_evidence")).toBe(true);
    expect(isAuthorized(researcher, "review_evidence")).toBe(false);
    expect(isAuthorized(researcher, "prepare_release")).toBe(false);
  });
  it("limits reviewers to reviewing", () => {
    const reviewer = { userId: "reviewer", role: "reviewer" as const };
    expect(isAuthorized(reviewer, "review_evidence")).toBe(true);
    expect(isAuthorized(reviewer, "submit_evidence")).toBe(false);
  });
  it("permits admin operations", () => {
    const admin = { userId: "admin", role: "admin" as const };
    expect(isAuthorized(admin, "manage_researchers")).toBe(true);
    expect(isAuthorized(admin, "prepare_release")).toBe(true);
  });
});
