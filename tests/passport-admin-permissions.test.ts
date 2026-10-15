import { describe, expect, it } from "vitest";
import { mayPerform, type ResearchIdentity } from "../src/lib/passport/admin-permissions";

const researcher: ResearchIdentity = { userId: "a", role: "researcher", active: true };
const reviewer: ResearchIdentity = { userId: "b", role: "reviewer", active: true };
const admin: ResearchIdentity = { userId: "c", role: "admin", active: true };
const submitted = { submissionOwnerId: "a", submissionStatus: "submitted" as const };

describe("passport administrator permission policy", () => {
  it("fails closed without authenticated active identity", () => {
    expect(mayPerform(null, "create-submission")).toBe(false);
    expect(mayPerform({ ...admin, active: false }, "read-audit")).toBe(false);
    expect(mayPerform({ ...admin, userId: "" }, "prepare-release")).toBe(false);
  });
  it("allows researchers to draft but never review or release", () => {
    expect(mayPerform(researcher, "create-submission")).toBe(true);
    expect(mayPerform(researcher, "edit-own-draft", { submissionOwnerId: "a", submissionStatus: "draft" })).toBe(true);
    expect(mayPerform(researcher, "edit-own-draft", submitted)).toBe(false);
    expect(mayPerform(researcher, "review-submission", submitted)).toBe(false);
    expect(mayPerform(researcher, "prepare-release")).toBe(false);
  });
  it("requires independent review of a submitted revision", () => {
    expect(mayPerform(reviewer, "review-submission", submitted)).toBe(true);
    expect(mayPerform(admin, "review-submission", submitted)).toBe(true);
    expect(mayPerform({ ...reviewer, userId: "a" }, "review-submission", submitted)).toBe(false);
    expect(mayPerform(reviewer, "review-submission", { ...submitted, submissionStatus: "draft" })).toBe(false);
    expect(mayPerform(reviewer, "review-submission")).toBe(false);
  });
  it("reserves release preparation and audit access for admins", () => {
    expect(mayPerform(admin, "read-audit")).toBe(true);
    expect(mayPerform(admin, "prepare-release")).toBe(true);
    expect(mayPerform(reviewer, "read-audit")).toBe(false);
    expect(mayPerform(reviewer, "prepare-release")).toBe(false);
  });
});
