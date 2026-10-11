import { describe, expect, it } from "vitest";
import { canAccessWorkspace, routeForRole, validateWorkspaceRedirect } from "../src/lib/passport/verification/session-contract";

describe("private workspace authorization contract", () => {
  it("selects the correct role landing area", () => {
    expect(routeForRole("researcher")).toBe("researcher");
    expect(routeForRole("reviewer")).toBe("reviewer");
    expect(routeForRole("admin")).toBe("admin");
  });
  it("denies role escalation", () => {
    expect(canAccessWorkspace("researcher", "admin")).toBe(false);
    expect(canAccessWorkspace("researcher", "reviewer")).toBe(false);
    expect(canAccessWorkspace("reviewer", "admin")).toBe(false);
    expect(canAccessWorkspace("admin", "admin")).toBe(true);
  });
  it("accepts only known internal redirect destinations", () => {
    expect(validateWorkspaceRedirect("/passport-verification/admin")).toBe("admin");
    expect(validateWorkspaceRedirect("https://evil.example")).toBeNull();
    expect(validateWorkspaceRedirect("//evil.example")).toBeNull();
    expect(validateWorkspaceRedirect("/passport-verification/../../admin")).toBeNull();
  });
});
