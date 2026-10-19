/**
 * Phase 4C.7: read-only case detail. Server component; no forms, buttons or writes.
 * Must only be rendered by the authenticated workspace route.
 */
import Link from "next/link";
import { jName } from "@/lib/passport/jurisdictions";
import { CASE_STATUS_DESCRIPTION, EVIDENCE_UNAVAILABLE, NOT_VERIFIED, proposedLabel, type CaseSource, type ResearchCase } from "@/lib/passport/review-workspace";
import { categoryMeta } from "@/lib/passport/types";
import { NotAdviceNotice, PriorityBadge, QualityBadge, StatusBadge } from "./badges";
import { WORKSPACE_PATH, caseHref } from "./WorkspaceView";

const h2 = "text-lg font-semibold text-ink sm:text-xl";
const card = "rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5";

const ACCESS_LABEL: Record<CaseSource["access"], string> = {
  read: "Read in full",
  partial: "Partly readable",
  blocked: "Could not be read",
  "published-register": "Published source register",
};

function SourceList({ items, empty }: { items: CaseSource[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li key={`${s.role}-${s.id}`} className="rounded-xl border border-line p-3 text-sm">
          <p className="font-semibold text-ink">
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-ink/30 underline-offset-2">{s.title}</a>
          </p>
          <p className="text-ink-2">{s.publisher} · {s.type} · <code className="text-xs">{s.id}</code></p>
          <dl className="mt-1 grid gap-x-4 gap-y-0.5 text-xs text-ink-2 sm:grid-cols-3">
            <div><dt className="inline text-muted">Checked: </dt><dd className="inline">{s.checked}</dd></div>
            <div><dt className="inline text-muted">Date on source: </dt><dd className="inline">{s.sourceDate}</dd></div>
            <div><dt className="inline text-muted">Access: </dt><dd className="inline">{ACCESS_LABEL[s.access]}</dd></div>
            {s.metadataDate && <div className="sm:col-span-3"><dt className="inline text-muted">File metadata only: </dt><dd className="inline">{s.metadataDate}</dd></div>}
          </dl>
          {s.linkReason && <p className="mt-2 text-xs text-ink"><span className="text-muted">Why linked: </span>{s.linkReason}</p>}
          {s.note && <p className="mt-2 text-xs text-ink-2">{s.note}</p>}
        </li>
      ))}
    </ul>
  );
}

export function CaseDetail({ c }: { c: ResearchCase }) {
  const supporting = c.sources.filter((s) => s.role === "supporting");
  const conflicting = c.sources.filter((s) => s.role === "conflicting");
  const publishedSources = c.sources.filter((s) => s.role === "published");
  const context = c.sources.filter((s) => s.role === "context");
  return (
    <article aria-labelledby="case-title" className="space-y-8">
      <p className="text-sm"><Link href={WORKSPACE_PATH} className="underline">← Back to the workspace</Link></p>
      <header className="space-y-3">
        <p className="text-xs text-muted"><span className="label-mono">Research case</span> <code>{c.id}</code></p>
        <h1 id="case-title" className="text-2xl font-semibold text-ink sm:text-3xl">{c.title}</h1>
        <dl className="grid gap-2 text-sm text-ink-2 sm:grid-cols-2">
          <div><dt className="inline text-muted">Passport: </dt><dd className="inline">{c.passport ? `${jName(c.passport)} (${c.passport})` : "All passports in scope (destination-wide topic)"}</dd></div>
          <div><dt className="inline text-muted">Destination: </dt><dd className="inline">{jName(c.destination)} ({c.destination})</dd></div>
        </dl>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={c.status} />
          <QualityBadge quality={c.quality} />
          <PriorityBadge label={c.priority.label} origin={c.priority.origin} />
        </div>
        <p className="text-xs text-muted">Priority source: {c.priority.origin}</p>
        <p className="text-sm text-ink-2"><span className="text-muted">Evidence status: </span>{CASE_STATUS_DESCRIPTION[c.status]}</p>
      </header>

      <NotAdviceNotice />

      <section aria-labelledby="case-published" className={card}>
        <h2 id="case-published" className={h2}>Current published record</h2>
        {c.published.length === 0 ? (
          <p className="mt-2 text-ink-2">{c.kind === "topic" ? "Not applicable: this topic is not a single passport–destination record." : `${NOT_VERIFIED}. The public index shows this pair as not yet verified.`}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-ink-2">
            {c.published.map((p) => (
              <li key={p.ruleId}>
                <strong className="text-ink">{categoryMeta[p.category].label}</strong>
                {p.maxStayDays ? `, up to ${p.maxStayDays} days` : ", stay period not recorded"} · source <code className="text-xs">{p.sourceId}</code>, checked {p.checked ?? "date unavailable"}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3"><SourceList items={publishedSources} empty="No published source for this case." /></div>
      </section>

      <section aria-labelledby="case-proposed" className={card}>
        <h2 id="case-proposed" className={h2}>Proposed classification</h2>
        <p className="mt-2 font-semibold text-ink">{proposedLabel(c)}</p>
        {c.proposals.length === 0 ? (
          <p className="mt-1 text-sm text-ink-2">No research proposal exists for this case yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {c.proposals.map((p) => (
              <li key={p.id} className="rounded-xl border border-line p-3 text-sm text-ink-2">
                <p className="font-semibold text-ink">{categoryMeta[p.proposedCategory].label} <span className="font-normal text-muted">(proposed, not approved)</span></p>
                <p className="text-xs text-muted"><code>{p.id}</code> · {p.kind} · {p.proposedVerification} · {p.confidence} confidence · basis: {p.evidenceBasis}</p>
                <p className="mt-2"><span className="text-muted">Evidence as read: </span>{p.evidence}</p>
                {p.conditions && <p className="mt-1"><span className="text-muted">Conditions: </span>{p.conditions}</p>}
                <p className="mt-1"><span className="text-muted">Stay: </span>{p.maxStayDays ? `${p.maxStayDays} days` : "Not stated in the evidence"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="case-sources" className={card}>
        <h2 id="case-sources" className={h2}>Supporting official sources</h2>
        <div className="mt-3"><SourceList items={supporting} empty={c.status === "unavailable" ? `${EVIDENCE_UNAVAILABLE}: no official source has been read for this case.` : "No source supports a classification for this case."} /></div>
        <h2 className={`${h2} mt-6`}>Conflicting sources</h2>
        <div className="mt-3"><SourceList items={conflicting} empty="No conflicting source is recorded for this case." /></div>
        <h2 className={`${h2} mt-6`}>Other official sources read</h2>
        <p className="mt-1 text-xs text-muted">Read for this case but neither supporting nor contradicting a classification.</p>
        <div className="mt-3"><SourceList items={context} empty="None." /></div>
      </section>

      <section aria-labelledby="case-questions" className={card}>
        <h2 id="case-questions" className={h2}>Outstanding questions</h2>
        {c.outstandingQuestions.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2">{c.outstandingQuestions.map((q, i) => <li key={i}>{q}</li>)}</ul>
        ) : (
          <p className="mt-2 text-sm text-muted">None recorded.</p>
        )}
        {c.relatedPairs.length > 0 && (
          <p className="mt-3 text-sm text-ink-2">Related pairs: {c.relatedPairs.map((k, i) => {
            const [p, d] = k.split(">");
            return <span key={k}>{i > 0 && ", "}<Link className="underline" href={caseHref(`pair-${p.toLowerCase()}-${d.toLowerCase()}`)}>{jName(p)}</Link></span>;
          })}</p>
        )}
      </section>

      <section aria-labelledby="case-notes" className={card}>
        <h2 id="case-notes" className={h2}>Researcher notes</h2>
        {c.researcherNotes.length ? (
          <ul className="mt-2 space-y-2 text-sm text-ink-2">{c.researcherNotes.map((n, i) => <li key={i}><span className="text-xs text-muted">{n.origin}: </span>{n.text}</li>)}</ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No researcher notes recorded.</p>
        )}
        <h2 className={`${h2} mt-6`}>Reviewer recommendations</h2>
        <p className="mt-1 text-xs text-muted">Read-only. Decisions are made in the review workflow, not on this page.</p>
        {c.reviewerRecommendations.length ? (
          <ul className="mt-2 space-y-2 text-sm text-ink-2">{c.reviewerRecommendations.map((n, i) => <li key={i}><span className="text-xs text-muted">{n.origin}: </span>{n.text}</li>)}</ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No reviewer recommendations recorded.</p>
        )}
      </section>

      <section aria-labelledby="case-findings" className={card}>
        <h2 id="case-findings" className={h2}>Automated validation findings</h2>
        {c.findings.length ? (
          <ul className="mt-2 space-y-1 text-sm text-ink-2">
            {c.findings.map((f, i) => (
              <li key={i}><strong className="text-ink">{f.severity}</strong> · {f.origin} · <code className="text-xs">{f.code}</code> ({f.subject}): {f.message}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">{c.quality === "not-assessed" ? "Not assessed: there is no proposal or published record to check." : "No automated findings. Human review is still required."}</p>
        )}
      </section>

      <section aria-labelledby="case-history" className={card}>
        <h2 id="case-history" className={h2}>Evidence history</h2>
        <p className="mt-1 text-xs text-muted">Reconstructed from repository research files and source dates. This is not an immutable audit log, and no review decisions have been recorded.</p>
        {c.history.length ? (
          <ol className="mt-3 space-y-1.5 text-sm text-ink-2">
            {c.history.map((h, i) => (
              <li key={i} className="flex flex-col sm:flex-row sm:gap-3">
                <span className="shrink-0 font-mono text-xs text-ink sm:w-24">{h.date ?? "Date not recorded"}</span>
                <span>{h.event} <span className="text-xs text-muted">({h.origin})</span></span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted">No history available.</p>
        )}
      </section>
    </article>
  );
}
