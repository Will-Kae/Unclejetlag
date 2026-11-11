export type AdminSummary = {
  activeResearchers: number;
  activeReviewers: number;
  pendingEvidence: number;
  openConflicts: number;
  releaseCandidates: number;
};

export type AdminAuditEntry = {
  id: string;
  eventType: string;
  actorLabel: string;
  occurredAt: string;
};

export type AdminReleaseCandidate = {
  id: string;
  label: string;
  status: "draft" | "ready_for_pr" | "withdrawn";
  evidenceCount: number | null;
};

type Props = {
  summary: AdminSummary;
  audit: readonly AdminAuditEntry[];
  releases: readonly AdminReleaseCandidate[];
  preview?: boolean;
};

/**
 * Read-only admin view. All data must be scoped to a verified active admin on
 * the server. No role changes, publication, or release operations are exposed.
 */
export function AdminDashboard({ summary, audit, releases, preview = false }: Props) {
  return (
    <main aria-labelledby="passport-admin-title">
      <header>
        <p>Uncle Jetlag / World Passport Index</p>
        <h1 id="passport-admin-title">Verification administration</h1>
        <p>Manage verification quality and publication readiness without bypassing independent review.</p>
        {preview && <p role="status">Preview only — no user, evidence, or release changes can be made.</p>}
      </header>
      <section aria-label="Operations overview">
        <h2>Operations overview</h2>
        <dl>
          <div><dt>Active researchers</dt><dd>{summary.activeResearchers}</dd></div>
          <div><dt>Active reviewers</dt><dd>{summary.activeReviewers}</dd></div>
          <div><dt>Pending evidence</dt><dd>{summary.pendingEvidence}</dd></div>
          <div><dt>Open conflicts</dt><dd>{summary.openConflicts}</dd></div>
          <div><dt>Release candidates</dt><dd>{summary.releaseCandidates}</dd></div>
        </dl>
      </section>
      <section aria-label="Release candidates">
        <h2>Release candidates</h2>
        {releases.length === 0 ? <p>No release candidates loaded.</p> : (
          <table>
            <caption>Release readiness is informational, not authorization to publish</caption>
            <thead><tr><th scope="col">Candidate</th><th scope="col">Evidence</th><th scope="col">Status</th></tr></thead>
            <tbody>{releases.map((candidate) => (
              <tr key={candidate.id}>
                <th scope="row">{candidate.label}</th>
                <td>{candidate.evidenceCount ?? "Not calculated"}</td>
                <td>{candidate.status.replaceAll("_", " ")}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
      <section aria-label="Audit history">
        <h2>Recent verification activity</h2>
        {audit.length === 0 ? <p>No audit events loaded.</p> : (
          <ol>{audit.map((event) => (
            <li key={event.id}>
              <time dateTime={event.occurredAt}>{event.occurredAt}</time>
              {" — "}{event.eventType} (actor: {event.actorLabel})
            </li>
          ))}</ol>
        )}
      </section>
      <section aria-label="Administration safeguards">
        <h2>Release safeguards</h2>
        <p>Approved evidence, independent reviewers, matching revisions and zero unresolved conflicts are required before release consideration.</p>
        <p>Administrative access never grants permission to self-review or automatically publish passport rules.</p>
      </section>
    </main>
  );
}
