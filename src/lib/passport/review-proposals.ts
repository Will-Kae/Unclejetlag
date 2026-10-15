import { transition, type TransitionContext } from "./verification";
import type { AccessRule, RuleRevision, VerificationStatus } from "./types";

/**
 * Phase 4C.2: pure, reviewable change proposal.
 * This module never persists records, grants access, or publishes data.
 * An authenticated, authorised server-side workflow must be built before enabling writes.
 */
export type ReviewProposal = {
  ruleId: string;
  requestedStatus: VerificationStatus;
  reviewerId: string;
  reason: string;
  context: TransitionContext;
};

export type ReviewAuditEntry = {
  ruleId: string;
  reviewerId: string;
  from: VerificationStatus;
  to: VerificationStatus;
  reason: string;
  revision: RuleRevision;
};

export function proposeEvidenceReview(
  rule: AccessRule,
  proposal: ReviewProposal,
  previousRevision = 0,
): { proposedRule: AccessRule; audit: ReviewAuditEntry } {
  const id = `${rule.passport}-${rule.destination}-${rule.sourceId}`;
  if (proposal.ruleId !== id) throw new Error("Review proposal rule ID mismatch");
  if (!proposal.reviewerId.trim()) throw new Error("Reviewer identity required");
  if (!proposal.reason.trim()) throw new Error("Review rationale required");
  const result = transition(rule, proposal.requestedStatus, {
    ...proposal.context,
    note: proposal.context.note || proposal.reason,
  }, previousRevision);
  return {
    proposedRule: result.rule,
    audit: {
      ruleId: id,
      reviewerId: proposal.reviewerId,
      from: rule.verification,
      to: proposal.requestedStatus,
      reason: proposal.reason,
      revision: result.revision,
    },
  };
}
