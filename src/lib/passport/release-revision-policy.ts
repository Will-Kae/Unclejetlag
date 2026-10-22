/** Phase 4D.2 proposal: pure release revision compatibility rule.
 * A review records the submitted revision N. A successful atomic approval
 * advances the submission to N+1. This module does not alter the database.
 */
export type ApprovedRevision = {
  status: "approved" | "draft" | "submitted" | "changes_requested" | "rejected";
  revision: number;
  reviewedRevision: number;
  decision: "approve" | "reject" | "request_changes";
  independentReviewer: boolean;
  reviewerActive: boolean;
  unresolvedConflict: boolean;
};
export function releaseRevisionEligible(input: ApprovedRevision): boolean {
  return input.status === "approved" &&
    Number.isSafeInteger(input.revision) && input.revision > 1 &&
    Number.isSafeInteger(input.reviewedRevision) &&
    input.reviewedRevision === input.revision - 1 &&
    input.decision === "approve" &&
    input.independentReviewer && input.reviewerActive && !input.unresolvedConflict;
}
