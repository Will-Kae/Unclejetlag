import { NextRequest, NextResponse } from "next/server";
import { verifyPassportBearer } from "@/lib/passport/verification/auth";
import { isVerificationEnabled, verificationConfig } from "@/lib/passport/verification/server-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };

type Profile = { role: "researcher" | "reviewer" | "admin"; active: boolean };
type Submission = { status: "draft" | "submitted" | "changes_requested" | "approved" | "rejected" };
type Conflict = { status: "open" | "resolved" };
type Candidate = { id: string; status: "draft" | "ready_for_pr" | "withdrawn" };
type Audit = { id: number; action: string; created_at: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isProfile(value: unknown): value is Profile {
  return isObject(value) && ["researcher", "reviewer", "admin"].includes(String(value.role)) && typeof value.active === "boolean";
}
function isSubmission(value: unknown): value is Submission {
  return isObject(value) && ["draft", "submitted", "changes_requested", "approved", "rejected"].includes(String(value.status));
}
function isConflict(value: unknown): value is Conflict {
  return isObject(value) && ["open", "resolved"].includes(String(value.status));
}
function isCandidate(value: unknown): value is Candidate {
  return isObject(value) && typeof value.id === "string" && ["draft", "ready_for_pr", "withdrawn"].includes(String(value.status));
}
function isAudit(value: unknown): value is Audit {
  return isObject(value) && Number.isSafeInteger(value.id) && typeof value.action === "string" && typeof value.created_at === "string";
}

/** Private, read-only operational summary. Counts are based on capped datasets. */
export async function GET(request: NextRequest) {
  if (!isVerificationEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  const token = authorization.slice(7);
  if (!token || token.length > 8192 || /\s/.test(token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  const identity = await verifyPassportBearer(token);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  if (identity.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });

  try {
    const { url, key } = verificationConfig();
    const read = async (table: string, select: string, limit = 1000): Promise<unknown[]> => {
      const query = new URLSearchParams({ select, limit: String(limit) });
      const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error("Database unavailable");
      const value: unknown = await response.json();
      if (!Array.isArray(value)) throw new Error("Unexpected database response");
      return value;
    };
    const [profiles, submissions, conflicts, candidates, audits] = await Promise.all([
      read("passport_research_profiles", "role,active"),
      read("passport_evidence_submissions", "status"),
      read("passport_verification_conflicts", "status"),
      read("passport_release_candidates", "id,status"),
      read("passport_verification_audit", "id,action,created_at", 100),
    ]);
    if (!profiles.every(isProfile) || !submissions.every(isSubmission)
      || !conflicts.every(isConflict) || !candidates.every(isCandidate)
      || !audits.every(isAudit)) throw new Error("Unexpected database response");
    const summary = {
      activeResearchers: profiles.filter((p) => p.active && p.role === "researcher").length,
      activeReviewers: profiles.filter((p) => p.active && (p.role === "reviewer" || p.role === "admin")).length,
      pendingEvidence: submissions.filter((s) => s.status === "submitted").length,
      openConflicts: conflicts.filter((c) => c.status === "open").length,
      releaseCandidates: candidates.length,
    };
    return NextResponse.json({
      summary,
      releases: candidates.map((candidate) => ({
        id: candidate.id, label: candidate.id, status: candidate.status, evidenceCount: null,
      })),
      audit: audits.map((entry) => ({
        id: String(entry.id), eventType: entry.action, occurredAt: entry.created_at,
      })),
      partial: [profiles, submissions, conflicts, candidates].some((rows) => rows.length === 1000),
      note: "Counts reflect loaded rows only; audit records contain no actor identity.",
    }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Admin data unavailable" }, { status: 503, headers: noStore });
  }
}
