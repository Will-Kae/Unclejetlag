import Link from "next/link";
import type { Destination, VisaBrief } from "@/lib/content";
import { Badge } from "@/components/ui/Badge";

export function DestinationFacts({ d, briefs }: { d: Destination; briefs: VisaBrief[] }) {
  const facts: { k: string; v: React.ReactNode }[] = [
    { k: "Capital", v: d.capital },
    { k: "Currency", v: <>{d.currency.name} <span className="font-mono text-muted">({d.currency.code}{d.currency.symbol ? ` · ${d.currency.symbol}` : ""})</span></> },
    { k: "Languages", v: d.languages.join(", ") },
    { k: "Time zone", v: d.timezone },
    { k: "Plugs & voltage", v: <>Type {d.plugTypes.join(", ")} · {d.voltage}</> },
    { k: "Drives on the", v: `${d.drivingSide} side` },
    { k: "Best time to visit", v: d.bestTime },
  ];
  return (
    <section aria-labelledby="key-facts" className="mt-8 max-w-[44rem] overflow-hidden rounded-3xl bg-white ring-1 ring-line">
      <div className="flex items-center justify-between bg-ink px-5 py-3.5 text-paper">
        <h2 id="key-facts" className="label-mono !font-sans !text-[0.72rem] text-paper">{d.countryName} at a glance</h2>
        <span className="font-mono text-sm text-[#ffb59e]">{d.iso2} · {d.currency.code}</span>
      </div>
      <dl className="grid sm:grid-cols-2">
        {facts.map((f) => (
          <div key={f.k} className="border-b border-line px-5 py-3.5 sm:[&:nth-child(odd)]:border-r">
            <dt className="label-mono !text-[0.6rem] text-muted">{f.k}</dt>
            <dd className="mt-1 text-[0.95rem] font-medium text-ink">{f.v}</dd>
          </div>
        ))}
        <div className="border-b border-line px-5 py-3.5">
          <dt className="label-mono !text-[0.6rem] text-muted">Emergency numbers</dt>
          <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[0.95rem] font-medium text-ink">
            {d.emergency.map((e) => (
              <span key={e.label}>{e.label} <a href={`tel:${e.number}`} className="font-mono text-jet-ink">{e.number}</a></span>
            ))}
          </dd>
        </div>
      </dl>
      <div className="px-5 py-4">
        <p className="label-mono !text-[0.6rem] text-muted">Main airports</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {d.airports.map((a) => (
            <li key={a.code} className="rounded-xl bg-paper px-3 py-2 text-sm ring-1 ring-line">
              <span className="font-mono font-semibold text-ink">{a.code}</span> <span className="text-muted">{a.name}</span>
            </li>
          ))}
        </ul>
      </div>
      {d.dailyBudget && (
        <div className="border-t border-line px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="label-mono !text-[0.6rem] text-muted">Typical daily budget · per person</p>
            {d.dailyBudget.isPlaceholder && <Badge tone="amber">Placeholder</Badge>}
          </div>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
            {[["Budget", d.dailyBudget.budget], ["Mid-range", d.dailyBudget.midRange], ["Comfort", d.dailyBudget.comfort]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-paper px-2 py-2.5 ring-1 ring-line">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="font-mono text-sm font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <div className="border-t border-line bg-amber-soft/40 px-5 py-4">
        <p className="text-sm font-semibold text-ink">Visa requirements depend on your passport.</p>
        {briefs.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {briefs.map((b) => (
              <li key={b.url}>
                <Link href={b.url} className="inline-block rounded-full bg-white px-3 py-1.5 text-sm font-medium text-ink ring-1 ring-line hover:ring-jet">
                  {b.passportName} passport →
                </Link>
              </li>
            ))}
            <li><Link href="/visas#finder" className="inline-block px-2 py-1.5 text-sm font-medium text-sky underline">Other passports</Link></li>
          </ul>
        ) : (
          <Link href="/visas#finder" className="mt-1 inline-block text-sm font-medium text-sky underline">Check the visa finder</Link>
        )}
      </div>
    </section>
  );
}
