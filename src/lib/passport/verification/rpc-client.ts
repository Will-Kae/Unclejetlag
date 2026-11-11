import "server-only";
import { evidenceReviewSchema, evidenceSubmissionSchema } from "./validation";

/**
 * Uses the caller's Supabase access token, NOT a service-role secret.
 * Postgres RPC must derive auth.uid() and enforce active role authorization.
 * Do not call until the audited transactional migration is applied and tested.
 */
function rpcConfig() {
  const rawUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!rawUrl || !publishableKey) throw new Error("Passport RPC is not configured");
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Invalid Supabase project URL");
  }
  return { origin: url.origin, publishableKey };
}

async function invoke<T>(procedure: string, token: string, payload: Record<string, unknown>): Promise<T> {
  if (!token || token.length > 8192 || /\s/.test(token)) throw new Error("Invalid access token");
  const { origin, publishableKey } = rpcConfig();
  const response = await fetch(`${origin}/rest/v1/rpc/${procedure}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Passport RPC failed (HTTP ${response.status})`);
  return (await response.json()) as T;
}

export async function submitPassportEvidence(token: string, input: unknown): Promise<string> {
  const parsed = evidenceSubmissionSchema.parse(input);
  if (parsed.sourceDocumentDate) {
    // The first RPC version has no source_document_date parameter.
    // Reject rather than silently discard supplied provenance.
    throw new Error("Source document date is not supported by the current RPC");
  }
  return invoke<string>("passport_submit_evidence", token, {
    p_rule_id: parsed.ruleId,
    p_passport_code: parsed.passportCode,
    p_destination_code: parsed.destinationCode,
    p_access: parsed.proposedAccess,
    p_source_id: parsed.sourceId,
    p_source_url: parsed.sourceUrl,
    p_observed_at: parsed.observedAt,
    p_rationale: parsed.rationale,
    p_ai_assisted: parsed.aiAssisted,
  });
}

export async function reviewPassportEvidence(token: string, input: unknown): Promise<void> {
  const parsed = evidenceReviewSchema.parse(input);
  await invoke<null>("passport_review_evidence", token, {
    p_submission_id: parsed.submissionId,
    p_revision: parsed.revision,
    p_decision: parsed.decision,
    p_rationale: parsed.rationale,
  });
}
