import Link from "next/link";
import type { Destination } from "@/lib/content";
import { Plane, Arrow } from "./icons";

/** Boarding-pass styled "destination intelligence" card — data-driven from a destination file. */
export function IntelPass({ d, fromCode = "HRE", fromCity = "Harare", visaHref }: { d: Destination; fromCode?: string; fromCity?: string; visaHref?: string }) {
  const airport = d.airports[0];
  const rows = [
    { k: "Currency", v: `${d.currency.code} · ${d.currency.name}` },
    { k: "Plugs", v: `Type ${d.plugTypes.join(" / ")} · ${d.voltage}` },
    { k: "Time", v: d.timezone },
    { k: "Emergency", v: d.emergency[0]?.number ?? "n/a" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md rotate-[1.5deg] transition-transform duration-500 hover:rotate-0">
      <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-lift ring-1 ring-line">
        <div className="flex items-center justify-between bg-ink px-6 py-4 text-paper">
          <span className="label-mono text-paper/70">Destination intel</span>
          <span className="label-mono text-[#ffb59e]">Uncle Jetlag</span>
        </div>
        <div className="px-6 pt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-4xl font-semibold tracking-tight text-ink">{fromCode}</p>
              <p className="text-sm text-muted">{fromCity}</p>
            </div>
            <div className="mb-3 flex flex-1 items-center gap-2 px-4 text-jet">
              <span className="h-px flex-1 border-t border-dashed border-ink/25" />
              <Plane className="h-5 w-5 rotate-45" />
              <span className="h-px flex-1 border-t border-dashed border-ink/25" />
            </div>
            <div className="text-right">
              <p className="font-mono text-4xl font-semibold tracking-tight text-ink">{airport?.code}</p>
              <p className="text-sm text-muted">{airport?.city}</p>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4">
            {rows.map((r) => (
              <div key={r.k}>
                <dt className="label-mono !text-[0.6rem] text-muted">{r.k}</dt>
                <dd className="mt-0.5 text-[0.92rem] font-semibold text-ink">{r.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative my-6">
          <div className="perforation mx-6" />
          <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" />
          <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" />
        </div>
        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <div>
            <p className="label-mono !text-[0.6rem] text-muted">Visa status</p>
            <p className="text-[0.92rem] font-semibold text-ink">Depends on your passport</p>
          </div>
          <Link href={visaHref ?? d.url} className="inline-flex items-center gap-1.5 rounded-full bg-jet px-4 py-2 text-sm font-semibold text-white hover:bg-jet-ink">
            Check <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Sample card · {d.countryName} guide</p>
    </div>
  );
}
