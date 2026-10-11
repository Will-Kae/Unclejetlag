import { NextRequest, NextResponse } from "next/server";
import { verifyPassportBearer } from "@/lib/passport/verification/auth";
import { isVerificationEnabled, verificationConfig } from "@/lib/passport/verification/server-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

type QueueRow = {
  id: string;
  rule_id: string;
  passport_code: string;
  destination_code: string;
  status: "submitted" | "changes_requested";
  revision: number;
  submitter_id: string;
  source_url: string;
};

/**
 * Read-only, independently scoped reviewer queue. Authentication and active
 * role are checked before any privileged database access. Never publish a
 * reviewer decision from this route.
 */
export async function GET(request: NextRequest) {
  if (!isVerificationEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const token = authorization.slice(7);
  if (!token || token.length > 8192 || /\s/.test(token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const identity = await verifyPassportBearer(token);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  if (identity.role !== "reviewer" && identity.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  }

  try {
    const { url, key } = verificationConfig();
    const params = new URLSearchParams({
      select: "id,rule_id,passport_code,destination_code,status,revision,submitter_id,source_url",
      status: "eq.submitted",
      submitter_id: `neq.${identity.userId}`,
      order: "created_at.asc",
      limit: "100",
    });
    const response = await fetch(`${url}/rest/v1/passport_evidence_submissions?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Database unavailable");
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || !rows.every(isQueueRow)) throw new Error("Unexpected database response");
    const submissions = (rows as QueueRow[]).filter((row) => row.submitter_id !== identity.userId).map((row) => ({
      id: row.id,
      ruleId: row.rule_id,
      passportCode: row.passport_code,
      destinationCode: row.destination_code,
      status: row.status,
      revision: row.revision,
      submitterId: row.submitter_id,
      sourceUrl: row.source_url,
    }));
    return NextResponse.json({
      reviewerId: identity.userId,
      summary: { awaitingReview: submissions.length, changesRequested: 0, reviewedByMe: 0, openConflicts: 0 },
      submissions,
      truncated: submissions.length === 100,
      summaryScope: "loaded_queue_only",
    }, { headers });
  } catch {
    return NextResponse.json({ error: "Review queue unavailable" }, { status: 503, headers });
  }
}

function isQueueRow(value: unknown): value is QueueRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.rule_id === "string"
    && typeof row.passport_code === "string" && typeof row.destination_code === "string"
    && typeof row.submitter_id === "string" && typeof row.source_url === "string"
    && row.status === "submitted" && Number.isSafeInteger(row.revision) && Number(row.revision) > 0;
}
