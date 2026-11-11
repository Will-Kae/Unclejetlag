import { NextRequest, NextResponse } from "next/server";
import { verifyPassportBearer } from "@/lib/passport/verification/auth";
import { extractPassportBearer } from "@/lib/passport/verification/session-token";
import { isVerificationEnabled, verificationConfig } from "@/lib/passport/verification/server-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };

type EvidenceRow = {
  id: string;
  rule_id: string;
  passport_code: string;
  destination_code: string;
  status: "draft" | "submitted" | "changes_requested" | "approved" | "rejected";
  revision: number;
};

/**
 * Server-filtered, read-only researcher data. Never accept a user ID in
 * query parameters or request body; it comes from verified Supabase Auth.
 */
export async function GET(request: NextRequest) {
  if (!isVerificationEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  const token = header.slice(7);
  if (!token || token.length > 8192 || /\s/.test(token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  const identity = await verifyPassportBearer(token);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  if (identity.role !== "researcher" && identity.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  }

  try {
    const { url, key } = verificationConfig();
    const params = new URLSearchParams({
      select: "id,rule_id,passport_code,destination_code,status,revision",
      submitter_id: `eq.${identity.userId}`,
      order: "created_at.desc",
      limit: "100",
    });
    const response = await fetch(`${url}/rest/v1/passport_evidence_submissions?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Database unavailable");
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || !rows.every(isEvidenceRow)) throw new Error("Unexpected database response");
    const submissions = (rows as EvidenceRow[]).map((row) => ({
      id: row.id,
      ruleId: row.rule_id,
      passportCode: row.passport_code,
      destinationCode: row.destination_code,
      status: row.status,
      revision: row.revision,
    }));
    const summary = {
      drafts: submissions.filter((s) => s.status === "draft").length,
      awaitingReview: submissions.filter((s) => s.status === "submitted").length,
      changesRequested: submissions.filter((s) => s.status === "changes_requested").length,
      approved: submissions.filter((s) => s.status === "approved").length,
    };
    return NextResponse.json({ summary, submissions, truncated: submissions.length === 100 }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Researcher data unavailable" }, { status: 503, headers: noStore });
  }
}

function isEvidenceRow(value: unknown): value is EvidenceRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.rule_id === "string"
    && typeof row.passport_code === "string" && typeof row.destination_code === "string"
    && ["draft", "submitted", "changes_requested", "approved", "rejected"].includes(String(row.status))
    && Number.isSafeInteger(row.revision) && Number(row.revision) > 0;
}
