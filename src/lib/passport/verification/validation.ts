import { z } from "zod";

/** Validation at the server boundary; authorization is a separate requirement. */
export const evidenceSubmissionSchema = z.object({
  ruleId: z.string().trim().min(1).max(160),
  passportCode: z.string().regex(/^[A-Z]{3}$/),
  destinationCode: z.string().regex(/^[A-Z]{3}$/),
  proposedAccess: z.string().trim().min(1).max(80),
  sourceId: z.string().trim().min(1).max(160),
  sourceUrl: z.url().refine((url) => new URL(url).protocol === "https:", "HTTPS source required"),
  sourceDocumentDate: z.iso.date().optional(),
  observedAt: z.iso.datetime({ offset: true }),
  rationale: z.string().trim().min(20).max(8000),
  aiAssisted: z.boolean(),
}).strict();

export const evidenceReviewSchema = z.object({
  submissionId: z.uuid(),
  revision: z.number().int().positive(),
  decision: z.enum(["approve", "reject", "request_changes"]),
  rationale: z.string().trim().min(20).max(8000),
}).strict();

export type EvidenceSubmissionInput = z.infer<typeof evidenceSubmissionSchema>;
export type EvidenceReviewInput = z.infer<typeof evidenceReviewSchema>;
