/** Server-side authorisation decisions for the Passport Intelligence admin.
 * A role must come from a trusted database lookup after Supabase Auth validates the user.
 * Never trust a role, active flag or user ID supplied in a browser request.
 */
export type ResearchRole = "admin" | "reviewer" | "researcher";
export type ResearchIdentity = { userId: string; role: ResearchRole; active: boolean };
export type ResearchAction =
  | "read-own-submission"
  | "create-submission"
  | "edit-own-draft"
  | "review-submission"
  | "read-audit"
  | "prepare-release";

export type AuthorisationContext = {
  submissionOwnerId?: string;
  submissionStatus?: "draft" | "submitted" | "changes_requested" | "approved" | "rejected";
};

export function mayPerform(
  identity: ResearchIdentity | null,
  action: ResearchAction,
  context: AuthorisationContext = {},
): boolean {
  if (!identity?.active || !identity.userId.trim()) return false;
  const isOwner = context.submissionOwnerId === identity.userId;
  switch (action) {
    case "create-submission":
      return identity.role === "researcher" || identity.role === "admin";
    case "read-own-submission":
      return isOwner || identity.role === "admin";
    case "edit-own-draft":
      return isOwner && (identity.role === "researcher" || identity.role === "admin")
        && (context.submissionStatus === "draft" || context.submissionStatus === "changes_requested");
    case "review-submission":
      return !isOwner && context.submissionStatus === "submitted"
        && (identity.role === "reviewer" || identity.role === "admin");
    case "read-audit":
    case "prepare-release":
      return identity.role === "admin";
  }
}
