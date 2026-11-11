import { ReviewQueue, type ReviewQueueItem } from "./ReviewQueue";

export type ReviewerSummary = {
  awaitingReview: number;
  changesRequested: number;
  reviewedByMe: number;
  openConflicts: number;
};

export type ReviewerQueueRecord = ReviewQueueItem & {
  submitterId: string;
  revision: number;
  sourceUrl: string;
};

type Props = {
  reviewerId: string;
  summary: ReviewerSummary;
  submissions: readonly ReviewerQueueRecord[];
  preview?: boolean;
};

/**
 * Read-only reviewer workspace. Input records must be filtered and authorized
 * on the server before rendering. No approval actions are available here.
 */
export function ReviewerDashboard({ reviewerId, summary, submissions, preview = false }: Props) {
  // Defense in depth for the preview; server authorization remains mandatory.
  const independent = submissions.filter((submission) => submission.submitterId !== reviewerId);
  const items: ReviewQueueItem[] = independent.map(({ id, ruleId, passportCode, destinationCode, status }) => ({
    id, ruleId, passportCode, destinationCode, status,
  }));

  return (
    <main aria-labelledby="passport-review-title">
      <header>
        <p>Uncle Jetlag / World Passport Index</p>
        <h1 id="passport-review-title">Independent reviewer workspace</h1>
        <p>Evidence must be independently reviewed before it can enter a release candidate.</p>
        {preview && <p role="status">Preview only — review decisions cannot be submitted.</p>}
      </header>
      <section aria-label="Review statistics">
        <h2>Review overview</h2>
        <dl>
          <div><dt>Awaiting review</dt><dd>{summary.awaitingReview}</dd></div>
          <div><dt>Changes requested</dt><dd>{summary.changesRequested}</dd></div>
          <div><dt>Reviewed by me</dt><dd>{summary.reviewedByMe}</dd></div>
          <div><dt>Open conflicts</dt><dd>{summary.openConflicts}</dd></div>
        </dl>
      </section>
      <ReviewQueue items={items} />
      <section aria-label="Review requirements">
        <h2>Review requirements</h2>
        <p>Check the original official source, its publication date, the exact passport–destination pair, and the evidence rationale. Do not infer visa-free access from missing data.</p>
        <p>Self-review is prohibited. Unresolved conflicts block release. No passport rule is published from this screen.</p>
      </section>
    </main>
  );
}
