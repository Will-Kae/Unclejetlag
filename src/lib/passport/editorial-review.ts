/** Phase 4D.1 pure editorial review gate. No database, network or publication side effects. */
import { mayPerform, type ResearchIdentity } from "./admin-permissions";

export type EditorialDecision = "approve" | "request-changes" | "reject" | "dispute";
export type EditorialStatus = "draft" | "submitted" | "changes_requested" | "approved" | "rejected" | "disputed";
export type EditorialReviewInput = {
  actor: ResearchIdentity | null;
  ownerId: string;
  status: EditorialStatus;
  expectedRevision: number;
  actualRevision: number;
  decision: EditorialDecision;
  rationale: string;
  sourceVerified: boolean;
  unresolvedConflicts: boolean;
};
export type EditorialReviewResult = { nextStatus: EditorialStatus; nextRevision: number; auditAction: string };

export class EditorialReviewError extends Error {
  constructor(public readonly code: "FORBIDDEN" | "STALE_REVISION" | "INVALID_STATE" | "MISSING_RATIONALE" | "EVIDENCE_BLOCKED") {
    super(code);
    this.name = "EditorialReviewError";
  }
}

/** Pure preflight only. The future DB transaction must recheck every invariant under row lock. */
export function validateEditorialReview(input: EditorialReviewInput): EditorialReviewResult {
  if (!mayPerform(input.actor, "review-submission", {
    submissionOwnerId: input.ownerId,
    submissionStatus: input.status === "submitted" ? "submitted" : undefined,
  })) throw new EditorialReviewError("FORBIDDEN");
  if (!Number.isSafeInteger(input.actualRevision) || input.actualRevision < 0 ||
      !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision !== input.actualRevision) {
    throw new EditorialReviewError("STALE_REVISION");
  }
  if (input.status !== "submitted") throw new EditorialReviewError("INVALID_STATE");
  if (!input.rationale.trim()) throw new EditorialReviewError("MISSING_RATIONALE");
  if (input.decision === "approve" && (!input.sourceVerified || input.unresolvedConflicts)) {
    throw new EditorialReviewError("EVIDENCE_BLOCKED");
  }
  const nextStatus: EditorialStatus = {
    approve: "approved",
    "request-changes": "changes_requested",
    reject: "rejected",
    dispute: "disputed",
  }[input.decision] as EditorialStatus;
  return { nextStatus, nextRevision: input.actualRevision + 1, auditAction: "editorial-review:" + input.decision };
}
