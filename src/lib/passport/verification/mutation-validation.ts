import { z } from "zod";

const uuid = z.uuid();
const rationale = z.string().trim().min(20).max(10000);
const sourceUrl = z.url().max(2048).refine((value) => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password && !u.hash;
  } catch { return false; }
}, "HTTPS source URL required");

const observedAt = z.iso.datetime({ offset: true });
const base = z.object({
  sourceId: z.string().trim().min(1).max(200),
  sourceUrl,
  observedAt,
  rationale,
  aiAssisted: z.boolean(),
}).strict();

export const submitEvidence = base.extend({
  ruleId: z.string().trim().min(1).max(200),
  passportCode: z.string().regex(/^[A-Z]{3}$/),
  destinationCode: z.string().regex(/^[A-Z]{3}$/),
  access: z.string().trim().min(1).max(100),
}).strict();

export const reviewEvidence = z.object({
  submissionId: uuid,
  revision: z.number().int().positive(),
  decision: z.enum(["approve", "reject", "request_changes"]),
  rationale,
}).strict();

export const resubmitEvidence = base.extend({
  submissionId: uuid,
  expectedRevision: z.number().int().positive(),
}).strict();

export type PassportMutationKind = "submit" | "review" | "resubmit";
export const mutationSchemas = {
  submit: submitEvidence,
  review: reviewEvidence,
  resubmit: resubmitEvidence,
} as const;

export function toDatabaseFields(kind: PassportMutationKind, input: unknown): Record<string, string | number | boolean> {
  switch (kind) {
    case "submit": {
      const v = submitEvidence.parse(input);
      return { p_rule_id: v.ruleId, p_passport_code: v.passportCode, p_destination_code: v.destinationCode,
        p_access: v.access, p_source_id: v.sourceId, p_source_url: v.sourceUrl,
        p_observed_at: v.observedAt, p_rationale: v.rationale, p_ai_assisted: v.aiAssisted };
    }
    case "review": {
      const v = reviewEvidence.parse(input);
      return { p_submission_id: v.submissionId, p_revision: v.revision, p_decision: v.decision, p_rationale: v.rationale };
    }
    case "resubmit": {
      const v = resubmitEvidence.parse(input);
      return { p_submission_id: v.submissionId, p_expected_revision: v.expectedRevision,
        p_source_id: v.sourceId, p_source_url: v.sourceUrl, p_observed_at: v.observedAt,
        p_rationale: v.rationale, p_ai_assisted: v.aiAssisted };
    }
  }
}
