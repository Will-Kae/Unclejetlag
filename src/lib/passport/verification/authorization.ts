import type { PassportIdentity, PassportRole } from "./auth";

export type PassportAction = "submit_evidence" | "review_evidence" | "manage_researchers" | "prepare_release";

const allowed: Record<PassportAction, readonly PassportRole[]> = {
  submit_evidence: ["researcher", "admin"],
  review_evidence: ["reviewer", "admin"],
  manage_researchers: ["admin"],
  prepare_release: ["admin"],
};

export function isAuthorized(identity: PassportIdentity | null, action: PassportAction): boolean {
  return identity !== null && allowed[action].includes(identity.role);
}
