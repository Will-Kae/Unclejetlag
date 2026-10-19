/**
 * Phase 4C.7: who may see the Evidence Review Workspace. Decisions use only the identity returned by
 * the existing server-side session verification (admin-session.server.ts), never request data.
 */
import { mayPerform, type ResearchIdentity } from "./admin-permissions";

export type WorkspaceAccess = { allowed: boolean; showImportDiagnostics: boolean };

const ROLES = new Set(["admin", "reviewer", "researcher"]);

export function workspaceAccess(identity: ResearchIdentity | null | undefined): WorkspaceAccess {
  const allowed = !!identity && identity.active === true && ROLES.has(identity.role) && identity.userId.trim().length > 0;
  return {
    allowed,
    // Import dry-run diagnostics follow the existing admin-only "prepare-release" permission.
    showImportDiagnostics: allowed && mayPerform(identity ?? null, "prepare-release"),
  };
}
