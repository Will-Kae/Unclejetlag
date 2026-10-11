import { EvidenceForm } from "./EvidenceForm";

export type ResearcherSummary = {
  drafts: number;
  awaitingReview: number;
  changesRequested: number;
  approved: number;
};

export type ResearcherSubmission = {
  id: string;
  ruleId: string;
  passportCode: string;
  destinationCode: string;
  status: "draft" | "submitted" | "changes_requested" | "approved" | "rejected";
  revision: number;
};

type Props = {
  summary: ResearcherSummary;
  submissions: readonly ResearcherSubmission[];
  preview?: boolean;
};

/**
 * Presentational dashboard. It accepts server-authorized data only.
 * Do not mount in a public route or pass browser-fetched privileged records.
 */
export function ResearcherDashboard({ summary, submissions, preview = false }: Props) {
  return (
    <main aria-labelledby="passport-research-title">
      <header>
        <p>Uncle Jetlag / World Passport Index</p>
        <h1 id="passport-research-title">Researcher workspace</h1>
        <p>Collect official evidence. Independent verification is required before publication.</p>
        {preview && <p role="status">Preview only — submissions are disabled and no evidence is saved.</p>}
      </header>
      <section aria-label="Research status">
        <h2>Evidence overview</h2>
        <dl>
          <div><dt>Drafts</dt><dd>{summary.drafts}</dd></div>
          <div><dt>Awaiting review</dt><dd>{summary.awaitingReview}</dd></div>
          <div><dt>Changes requested</dt><dd>{summary.changesRequested}</dd></div>
          <div><dt>Approved</dt><dd>{summary.approved}</dd></div>
        </dl>
      </section>
      <section aria-label="My submissions">
        <h2>My evidence submissions</h2>
        {submissions.length === 0 ? (
          <p>No evidence submissions are available.</p>
        ) : (
          <table>
            <caption>Passport evidence assigned to this researcher</caption>
            <thead><tr><th scope="col">Rule</th><th scope="col">Passport</th><th scope="col">Destination</th><th scope="col">Revision</th><th scope="col">Status</th></tr></thead>
            <tbody>{submissions.map((item) => (
              <tr key={item.id}>
                <th scope="row">{item.ruleId}</th>
                <td>{item.passportCode}</td>
                <td>{item.destinationCode}</td>
                <td>{item.revision}</td>
                <td>{item.status.replaceAll("_", " ")}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
      <section aria-label="New evidence draft">
        <EvidenceForm />
      </section>
    </main>
  );
}
