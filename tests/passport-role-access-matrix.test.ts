import { describe, expect, it } from "vitest";
import { canAccessWorkspace, routeForRole } from "../src/lib/passport/verification/session-contract";
import { extractPassportBearer } from "../src/lib/passport/verification/session-token";

describe("passport verification access matrix", () => {
  const cases = [
    { role: "researcher" as const, allowed: ["researcher"], denied: ["reviewer", "admin"] },
    { role: "reviewer" as const, allowed: ["reviewer"], denied: ["researcher", "admin"] },
    { role: "admin" as const, allowed: ["researcher", "reviewer", "admin"], denied: [] },
  ];
  for (const item of cases) {
    it(`authorizes only expected workspaces for ${item.role}`, () => {
      for (const workspace of item.allowed) {
        expect(canAccessWorkspace(item.role, workspace as "researcher" | "reviewer" | "admin")).toBe(true);
      }
      for (const workspace of item.denied) {
        expect(canAccessWorkspace(item.role, workspace as "researcher" | "reviewer" | "admin")).toBe(false);
      }
      expect(item.allowed).toContain(routeForRole(item.role));
    });
  }

  it("rejects missing, malformed, or oversized bearer tokens", () => {
    for (const value of [null, "", "Basic abc", "Bearer ", "Bearer a b", "Bearer " + "x".repeat(8193)]) {
      expect(extractPassportBearer(value)).toBeNull();
    }
  });
});
