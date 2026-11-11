import type { PassportRole } from "./auth";

export type WorkspaceRoute = "researcher" | "reviewer" | "admin";

export function routeForRole(role: PassportRole): WorkspaceRoute {
  if (role === "admin") return "admin";
  if (role === "reviewer") return "reviewer";
  return "researcher";
}

/**
 * Authorization is always checked against the verified active profile.
 * The UI-selected route never upgrades a researcher's privileges.
 */
export function canAccessWorkspace(role: PassportRole, workspace: WorkspaceRoute): boolean {
  if (workspace === "admin") return role === "admin";
  if (workspace === "reviewer") return role === "reviewer" || role === "admin";
  return role === "researcher" || role === "admin";
}

export function validateWorkspaceRedirect(path: string): WorkspaceRoute | null {
  if (path === "/passport-verification/researcher") return "researcher";
  if (path === "/passport-verification/reviewer") return "reviewer";
  if (path === "/passport-verification/admin") return "admin";
  return null;
}
