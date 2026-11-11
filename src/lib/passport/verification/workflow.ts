/**
 * Pure Phase 2B-B workflow guards. No public page imports this module.
 * The database must independently enforce these invariants.
 */
export type ReviewDecision = "approve" | "reject" | "request_changes";
export type SubmissionStatus = "draft" | "submitted" | "changes_requested" | "approved" | "rejected";
export type Role = "admin" | "researcher" | "reviewer";

export type Reviewer = { id: string; role: Role; active: boolean };
export type Submission = { id: string; submitterId: string; status: SubmissionStatus; revision: number };
export type Review = { reviewerId: string; decision: ReviewDecision; revision: number };

export function canReview(submission: Submission, reviewer: Reviewer): boolean {
  return submission.status === "submitted"
    && reviewer.active
    && (reviewer.role === "reviewer" || reviewer.role === "admin")
    && reviewer.id !== submission.submitterId;
}

export function nextSubmissionStatus(
  submission: Submission,
  reviewer: Reviewer,
  decision: ReviewDecision,
): SubmissionStatus {
  if (!canReview(submission, reviewer)) throw new Error("Independent active reviewer required");
  if (decision === "approve") return "approved";
  if (decision === "reject") return "rejected";
  return "changes_requested";
}

export function canEnterReleaseCandidate(
  submission: Submission,
  reviews: readonly Review[],
  unresolvedConflicts: number,
): boolean {
  if (submission.status !== "approved" || unresolvedConflicts !== 0) return false;
  return reviews.some(
    (review) => review.reviewerId !== submission.submitterId
      && review.revision === submission.revision
      && review.decision === "approve",
  );
}
