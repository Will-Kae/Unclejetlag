/** Phase 4C.6: authenticated, read-only evidence resolution queue. No database writes. */
import { ruleRecords, sources } from "@/lib/passport/data";
import { assessEvidenceQuality } from "@/lib/passport/proposal-quality";
import { researchPackage } from "../../../research/phase-4c3/package";

export function PassportEvidenceResolutionQueue() {
  const report = assessEvidenceQuality(researchPackage, { records: ruleRecords, sources });
  const byProposal = new Map<string, typeof report.findings>();
  for (const finding of report.findings) {
    byProposal.set(finding.proposalId, [...(byProposal.get(finding.proposalId) ?? []), finding]);
  }
  return (
    <section aria-labelledby="passport-resolution-queue" className="mt-10 space-y-4">
      <h2 id="passport-resolution-queue" className="text-2xl font-semibold">Evidence resolution queue</h2>
      <p>Research-only assessment. Findings are advisory; no approval, import, scoring or publication is available.</p>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div><dt>Research proposals</dt><dd className="font-semibold">{report.proposalCount}</dd></div>
        <div><dt>Blocked for review</dt><dd className="font-semibold">{report.blockedCount}</dd></div>
        <div><dt>Disputed proposals</dt><dd className="font-semibold">{report.disputedCount}</dd></div>
      </dl>
      {!report.importPlanValid && <p role="alert">Draft import validation has {report.importIssues.length} outstanding issues.</p>}
      <div className="space-y-3">
        {researchPackage.proposals.map((proposal) => {
          const findings = byProposal.get(proposal.id) ?? [];
          const source = researchPackage.sources.find((item) => item.id === proposal.sourceId);
          return (
            <article key={proposal.id} className="rounded-xl border p-4" aria-label={`Proposal ${proposal.id}`}>
              <h3 className="font-semibold">{proposal.passport} → {proposal.destination}</h3>
              <p className="text-sm">Proposal {proposal.id} · {proposal.proposedVerification} · {proposal.kind} · {proposal.confidence} confidence</p>
              <p className="mt-2">Proposed category (not approved): {proposal.proposedCategory}</p>
              <p className="mt-2">{proposal.evidence}</p>
              {proposal.conflicts && <p className="mt-2">Conflict: {proposal.conflicts}</p>}
              {proposal.reviewerNotes && <p className="mt-2">Reviewer check: {proposal.reviewerNotes}</p>}
              {source && <p className="mt-2 text-sm">Source: <a className="underline" href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher}</a> · checked {source.checked} · access {source.access}</p>}
              {findings.length > 0 && <ul className="mt-3 list-disc pl-6 text-sm">{findings.map((finding, i) => <li key={`${finding.code}-${i}`}>{finding.severity}: {finding.message}</li>)}</ul>}
              {findings.length === 0 && <p className="mt-2 text-sm">No automated quality findings; human review still required.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
