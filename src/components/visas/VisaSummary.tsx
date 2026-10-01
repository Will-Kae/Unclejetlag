import type { VisaBrief } from "@/lib/content";
import { Callout } from "@/components/mdx/Callout";
import { ArrowUpRight } from "@/components/ui/icons";

export function VisaDisclaimer() {
  return (
    <Callout type="verify" title="Immigration rules change">
      <p>
        Visa and entry requirements can change at short notice and can depend on your travel history, purpose of trip and route. Always verify
        requirements with the relevant government or embassy before booking or travelling. Uncle Jetlag is not an immigration adviser and final
        entry decisions are made by border officials.
      </p>
    </Callout>
  );
}

export function VisaSummary({ v }: { v: VisaBrief }) {
  const rows = [
    ["Visa requirement", v.requirement],
    ["Visa type", v.visaType],
    ["Allowed stay", v.allowedStay],
    ["How to apply", v.applicationMethod],
    ["Approximate fees", v.fees],
    ["Processing time", v.processingTime],
  ];
  return (
    <section aria-labelledby="visa-summary" className="mt-8 max-w-[44rem]">
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        <div className="flex items-center justify-between gap-3 bg-ink px-5 py-3.5 text-paper">
          <h2 id="visa-summary" className="label-mono !font-sans !text-[0.72rem]">Entry summary</h2>
          <span className="font-mono text-sm text-[#ffb59e]">{v.passportName} → {v.destinationName}</span>
        </div>
        <dl className="divide-y divide-line">
          {rows.map(([k, val]) => (
            <div key={k} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="label-mono !text-[0.62rem] text-muted sm:pt-1">{k}</dt>
              <dd className="text-[0.97rem] font-medium text-ink">{val}</dd>
            </div>
          ))}
          {v.documents.length > 0 && (
            <div className="grid gap-1 px-5 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="label-mono !text-[0.62rem] text-muted sm:pt-1">Typical documents</dt>
              <dd>
                <ul className="list-disc space-y-1 pl-5 text-[0.95rem] text-ink-2 marker:text-jet">
                  {v.documents.map((d) => <li key={d}>{d}</li>)}
                </ul>
              </dd>
            </div>
          )}
          <div className="grid gap-1 bg-palm-soft/40 px-5 py-4 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="label-mono !text-[0.62rem] text-palm sm:pt-1">Official sources</dt>
            <dd>
              <ul className="space-y-1.5">
                {v.officialResources.map((r) => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[0.95rem] font-semibold text-sky underline decoration-sky/30 underline-offset-2">
                      {r.title} <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                    {r.publisher && <span className="text-sm text-muted"> ({r.publisher})</span>}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
      <VisaDisclaimer />
    </section>
  );
}
