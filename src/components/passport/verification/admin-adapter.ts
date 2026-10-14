import type { AdminAuditEntry, AdminReleaseCandidate, AdminSummary } from "./AdminDashboard";

/** Maps the private API payload into the admin UI without implying publication readiness. */
type CandidateStatus = "draft" | "ready_for_pr" | "withdrawn";
export type AdminApiResponse = {
  summary: AdminSummary;
  releases: readonly { id: string; label: string; status: CandidateStatus; evidenceCount: null }[];
  audit: readonly { id: string; eventType: string; occurredAt: string }[];
  partial: boolean;
};

export function adaptAdminResponse(data: AdminApiResponse): {
  summary: AdminSummary;
  releases: AdminReleaseCandidate[];
  audit: AdminAuditEntry[];
  partial: boolean;
} {
  return {
    summary: data.summary,
    releases: data.releases.map((candidate) => ({
      id: candidate.id,
      label: candidate.label,
      status: candidate.status,
      evidenceCount: candidate.evidenceCount,
    })),
    audit: data.audit.map((entry) => ({
      id: entry.id,
      eventType: entry.eventType,
      actorLabel: "Withheld",
      occurredAt: entry.occurredAt,
    })),
    partial: data.partial,
  };
}
