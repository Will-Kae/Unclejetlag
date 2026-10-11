import { describe, expect, it } from "vitest";
import { canAccessWorkspace, type WorkspaceRoute } from "../src/lib/passport/verification/session-contract";
import type { PassportRole } from "../src/lib/passport/verification/auth";

const matrix: Record<PassportRole, Record<WorkspaceRoute, boolean>> = {
  researcher: { researcher: true, reviewer: false, admin: false },
  reviewer: { researcher: false, reviewer: true, admin: false },
  admin: { researcher: true, reviewer: true, admin: true },
};

describe("passport verification role access matrix", () => {
  for (const role of ["researcher", "reviewer", "admin"] as const) {
    for (const workspace of ["researcher", "reviewer", "admin"] as const) {
      it(`${role} to ${workspace}: ${matrix[role][workspace] ? "allowed" : "denied"}`, () => {
        expect(canAccessWorkspace(role, workspace)).toBe(matrix[role][workspace]);
      });
    }
  }
});
