/**
 * Phase 4C.7: Evidence Review Workspace (overview, priorities, filters, case table, coverage).
 * Server component. Read-only: the only form submits GET filters back to this page. It performs no
 * authorisation itself and must only be rendered by the authenticated workspace route.
 */
import Link from "next/link";
import { jName, jurisdictions } from "@/lib/passport/jurisdictions";
import {
  CASE_STATUS_LABEL,
  FOCUS_COUNTRIES,
  OPEN_STATUSES,
  QUALITY_LABEL,
  filterCases,
  paginate,
  proposedLabel,
  publishedLabel,
  type ResearchCase,
  type WorkspaceOverview,
  type WorkspaceQuery,
} from "@/lib/passport/review-workspace";
import { NotAdviceNotice, PriorityBadge, QualityBadge, StatusBadge } from "./badges";

export const WORKSPACE_PATH = "/passport-index/research-admin/workspace";
export const caseHref = (id: string) => `${WORKSPACE_PATH}/cases/${id}`;

const h2 = "text-xl font-semibold text-ink sm:text-2xl";
const card = "rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5";

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className={card}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-ink">{value}</dd>
      {note && <dd className="mt-1 text-xs text-muted">{note}</dd>}
    </div>
  );
}

export function WorkspaceOverviewPanel({ o, asOf, version }: { o: WorkspaceOverview; asOf: string; version: string }) {
  return (
    <section aria-labelledby="ws-overview" className="space-y-4">
      <h2 id="ws-overview" className={h2}>Research overview</h2>
      <p className="text-sm text-ink-2">
        Dataset {version} as of {asOf}. All figures are calculated from the repository’s research files and published dataset each time this page loads.
      </p>
      <div>
        <h3 className="label-mono text-xs text-muted">Published index (verified, unchanged by this workspace)</h3>
        <dl className="mt-2 grid gap-3 sm:grid-cols-3">
          <Stat label="Verified published records" value={o.verifiedPublishedRecords} note={`${o.coveragePercent}% of ${o.totalPairs.toLocaleString("en-GB")} passport–destination pairs`} />
          <Stat label="Ranking status" value={o.rankingPublished ? "Published" : "Not published"} note={`${o.scoredPassports} passports meet the coverage threshold; ${o.requiredForRanking} are needed before rankings can be published`} />
          <Stat label="Evidence-quality checks" value={`${o.qualityErrors} errors`} note={`${o.qualityWarnings} warnings on the published dataset and its sources`} />
        </dl>
      </div>
      <div>
        <h3 className="label-mono text-xs text-muted">Research (unapproved, not published)</h3>
        <dl className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Research proposals" value={o.totalProposals} note={`${o.proposalsPending} pending, ${o.proposalsDisputed} disputed`} />
          <Stat label="Pending verification" value={o.casesByStatus["pending-verification"]} note="Cases with a readable source, awaiting review" />
          <Stat label="Disputed cases" value={o.disputedCases} note={`${o.casesByStatus["re-verification"]} involve a published record`} />
          <Stat label="Blocked: evidence unavailable" value={o.blockedByMissingEvidence} note="No readable official source yet" />
        </dl>
        <p className="mt-2 text-xs text-muted">
          Proposal checks: {o.proposalBlockers} blocking and {o.proposalReviewFindings} review findings across {o.totalProposals} proposals. {o.cases} research cases in total.
        </p>
      </div>
    </section>
  );
}

export function PrioritiesPanel({ cases }: { cases: ResearchCase[] }) {
  const focus = cases.filter((c) => (FOCUS_COUNTRIES as readonly string[]).includes(c.destination) && OPEN_STATUSES.includes(c.status) && c.plan);
  return (
    <section aria-labelledby="ws-priorities" className="space-y-3">
      <h2 id="ws-priorities" className={h2}>Research priorities</h2>
      <p className="text-sm text-ink-2">
        Unresolved cases for Tanzania, Namibia, Malawi and Ghana from the Phase 4C.6 Evidence Resolution Plan, in plan order. Nothing here resolves a dispute.
      </p>
      <ol className="space-y-2">
        {focus.map((c) => (
          <li key={c.id} className={`${card} flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between`}>
            <div className="min-w-0">
              <Link href={caseHref(c.id)} className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink">
                {c.title}
              </Link>
              <p className="mt-1 text-sm text-ink-2">{c.plan?.evidenceNeeded}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <PriorityBadge label={c.priority.label} origin={c.priority.origin} />
              <StatusBadge status={c.status} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FiltersForm({ query, countries }: { query: WorkspaceQuery; countries: string[] }) {
  const field = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink";
  return (
    <form method="get" action={WORKSPACE_PATH} role="search" aria-label="Search and filter research cases" className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-6`}>
      <div className="sm:col-span-2">
        <label htmlFor="ws-q" className="text-sm font-medium text-ink">Search</label>
        <input id="ws-q" name="q" type="search" defaultValue={query.q} maxLength={80} placeholder="Country, case, proposal or source" className={field} />
      </div>
      <div>
        <label htmlFor="ws-country" className="text-sm font-medium text-ink">Country</label>
        <select id="ws-country" name="country" defaultValue={query.country} className={field}>
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{jName(c)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ws-status" className="text-sm font-medium text-ink">Status</label>
        <select id="ws-status" name="status" defaultValue={query.status} className={field}>
          <option value="">All statuses</option>
          {Object.entries(CASE_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ws-priority" className="text-sm font-medium text-ink">Priority</label>
        <select id="ws-priority" name="priority" defaultValue={query.priority} className={field}>
          <option value="">All priorities</option>
          {["P0", "P1", "P2", "P3"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          <option value="UNRANKED">Unranked</option>
        </select>
      </div>
      <div>
        <label htmlFor="ws-quality" className="text-sm font-medium text-ink">Evidence quality</label>
        <select id="ws-quality" name="quality" defaultValue={query.quality} className={field}>
          <option value="">All</option>
          {Object.entries(QUALITY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
        <button type="submit" className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper">Apply filters</button>
        <Link href={WORKSPACE_PATH} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink underline">Clear</Link>
      </div>
    </form>
  );
}

function queryString(q: WorkspaceQuery, page: number) {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.country) p.set("country", q.country);
  if (q.status) p.set("status", q.status);
  if (q.priority) p.set("priority", q.priority);
  if (q.quality) p.set("quality", q.quality);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function CaseTable({ cases, query }: { cases: ResearchCase[]; query: WorkspaceQuery }) {
  const filtered = filterCases(cases, query);
  const page = paginate(filtered, query.page);
  return (
    <section aria-labelledby="ws-cases" className="space-y-3">
      <h2 id="ws-cases" className={h2}>Evidence review table</h2>
      <p className="text-sm text-ink-2" role="status" aria-live="polite">
        Showing {page.items.length} of {page.total} matching cases (of {cases.length}). Page {page.page} of {page.pages}.
      </p>
      {page.total === 0 ? (
        <p className={card}>No cases match these filters.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl bg-white ring-1 ring-line lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Research cases. Proposed classifications are not approved.</caption>
              <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted">
                <tr>
                  {["Passport", "Destination", "Proposed classification", "Published classification", "Status", "Source authority", "Source checked", "Evidence quality", "Priority"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {page.items.map((c) => (
                  <tr key={c.id} className="align-top">
                    <th scope="row" className="px-3 py-2 font-semibold text-ink">
                      <Link href={caseHref(c.id)} className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink">
                        {c.passport ? jName(c.passport) : "All passports (topic)"}
                      </Link>
                    </th>
                    <td className="px-3 py-2">{jName(c.destination)}{c.kind === "topic" && <span className="block text-xs text-muted">{c.title}</span>}</td>
                    <td className="px-3 py-2">{proposedLabel(c)}</td>
                    <td className="px-3 py-2">{publishedLabel(c)}</td>
                    <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2">{c.primarySource?.authority ?? <span className="text-muted">Evidence unavailable</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{c.primarySource?.checked ?? <span className="text-muted">Not verified</span>}</td>
                    <td className="px-3 py-2"><QualityBadge quality={c.quality} /></td>
                    <td className="px-3 py-2"><PriorityBadge label={c.priority.label} origin={c.priority.origin} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-2 lg:hidden" aria-label="Research cases">
            {page.items.map((c) => (
              <li key={c.id} className={card}>
                <Link href={caseHref(c.id)} className="font-semibold text-ink underline decoration-ink/30 underline-offset-2">{c.title}</Link>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={c.status} />
                  <QualityBadge quality={c.quality} />
                  <PriorityBadge label={c.priority.label} origin={c.priority.origin} />
                </div>
                <dl className="mt-2 grid grid-cols-1 gap-1 text-sm text-ink-2">
                  <div><dt className="inline text-muted">Proposed: </dt><dd className="inline">{proposedLabel(c)}</dd></div>
                  <div><dt className="inline text-muted">Published: </dt><dd className="inline">{publishedLabel(c)}</dd></div>
                  <div><dt className="inline text-muted">Source: </dt><dd className="inline">{c.primarySource ? `${c.primarySource.authority}, checked ${c.primarySource.checked}` : "Evidence unavailable"}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
      {page.pages > 1 && (
        <nav aria-label="Case table pages" className="flex items-center justify-between text-sm">
          {page.page > 1 ? <Link className="font-semibold underline" href={`${WORKSPACE_PATH}${queryString(query, page.page - 1)}`}>Previous page</Link> : <span />}
          {page.page < page.pages ? <Link className="font-semibold underline" href={`${WORKSPACE_PATH}${queryString(query, page.page + 1)}`}>Next page</Link> : <span />}
        </nav>
      )}
    </section>
  );
}

export function CountryCoverage({ o }: { o: WorkspaceOverview }) {
  return (
    <section aria-labelledby="ws-countries" className="space-y-3">
      <h2 id="ws-countries" className={h2}>Country coverage</h2>
      <p className="text-sm text-ink-2">Verified counts come from the published index only. Unverified pairs are unknown, not visa-required.</p>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Verification progress by country</caption>
          <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-3 py-2">Country</th>
              <th scope="col" className="px-3 py-2">Verified as passport</th>
              <th scope="col" className="px-3 py-2">Published as destination</th>
              <th scope="col" className="px-3 py-2">Proposals</th>
              <th scope="col" className="px-3 py-2">Open cases</th>
              <th scope="col" className="px-3 py-2">Disputed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {o.countries.map((c) => (
              <tr key={c.code}>
                <th scope="row" className="px-3 py-2 font-semibold text-ink">
                  <Link className="underline decoration-ink/30 underline-offset-2" href={`${WORKSPACE_PATH}?country=${c.code}`}>{c.name}</Link>
                  {(FOCUS_COUNTRIES as readonly string[]).includes(c.code) && <span className="ml-2 text-xs font-normal text-muted">(priority)</span>}
                </th>
                <td className="px-3 py-2">{c.passportCoveragePercent === null ? "Not verified" : `${c.verifiedAsPassport} (${c.passportCoveragePercent}%)`}</td>
                <td className="px-3 py-2">{c.publishedAsDestination}</td>
                <td className="px-3 py-2">{c.proposals}</td>
                <td className="px-3 py-2">{c.openCases}</td>
                <td className="px-3 py-2">{c.disputedCases}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function WorkspaceView({ cases, overview, query, asOf, version }: { cases: ResearchCase[]; overview: WorkspaceOverview; query: WorkspaceQuery; asOf: string; version: string }) {
  const countries = [...new Set(cases.flatMap((c) => [c.destination, ...(c.passport ? [c.passport] : [])]))]
    .filter((c) => jurisdictions.some((j) => j.code === c))
    .sort((a, b) => jName(a).localeCompare(jName(b)));
  return (
    <div className="space-y-10">
      <NotAdviceNotice />
      <WorkspaceOverviewPanel o={overview} asOf={asOf} version={version} />
      <PrioritiesPanel cases={cases} />
      <div className="space-y-4">
        <FiltersForm query={query} countries={countries} />
        <CaseTable cases={cases} query={query} />
      </div>
      <CountryCoverage o={overview} />
    </div>
  );
}
