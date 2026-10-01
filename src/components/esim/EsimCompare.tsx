import Link from "next/link";
import { compareRows, esimProviders, ESIM_FACTS_CHECKED } from "@/data/esim";
import { getPartner, goHref, publicDiscount } from "@/data/partners";
import { formatDate } from "@/lib/utils";

/** Side-by-side plan-type comparison. Facts only; unverified cells say so. No prices, no "winner". */
export function EsimCompare({ placement = "esim-compare", destination }: { placement?: string; destination?: string }) {
  const cols = esimProviders.map((f) => ({ f, p: getPartner(f.partner)! })).filter((c) => c.p?.active);
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl ring-1 ring-line">
        <table className="w-full min-w-[36rem] border-collapse bg-white text-left text-[0.95rem]">
          <caption className="sr-only">Travel eSIM providers compared by plan features</caption>
          <thead>
            <tr className="border-b border-line bg-sand/60">
              <th scope="col" className="w-44 p-4 align-bottom font-semibold text-muted">Feature</th>
              {cols.map(({ p, f }) => (
                <th key={p.slug} scope="col" className="p-4 align-bottom">
                  <span className="block font-display text-xl font-semibold text-ink">{p.name}</span>
                  <span className="mt-0.5 block text-sm font-normal text-muted">{f.planTypes}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareRows.map((r) => (
              <tr key={r.key} className="border-b border-line align-top">
                <th scope="row" className="p-4 font-medium text-ink-2">{r.label}</th>
                {cols.map(({ p, f }) => {
                  const v = f[r.key];
                  return (
                    <td key={p.slug} className="p-4">
                      {v ? (
                        <>
                          <span className="font-semibold text-ink">{v.value}</span>
                          {v.note && <span className="mt-1 block text-sm leading-snug text-muted">{v.note}</span>}
                        </>
                      ) : (
                        <span className="text-muted">Check with provider</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-b border-line align-top">
              <th scope="row" className="p-4 font-medium text-ink-2">Reader discount</th>
              {cols.map(({ p }) => {
                const d = publicDiscount(p);
                return (
                  <td key={p.slug} className="p-4">
                    {d ? (
                      <><span className="font-semibold text-ink">{d.amount}</span><span className="mt-1 block font-mono text-sm text-jet-ink">CODE: {d.code}</span></>
                    ) : (
                      <span className={p.discountNote ? "font-semibold text-ink" : "text-muted"}>{p.discountNote ?? "None confirmed yet"}</span>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" className="p-4 font-medium text-ink-2">Prices</th>
              {cols.map(({ p }) => (
                <td key={p.slug} className="p-4">
                  <a
                    href={goHref(p.slug, { d: destination, placement })}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    data-track="partner_comparison"
                    data-partner={p.slug}
                    className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-paper hover:bg-jet"
                  >
                    View current plan →
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Plan features checked by hand on each provider&apos;s own pages on {formatDate(ESIM_FACTS_CHECKED)}; details can vary by destination and
        change without notice. Sources:{" "}
        {cols.flatMap(({ f }) => f.sources).map((s, i, a) => (
          <span key={s.url}>
            <a href={s.url} rel="noopener" target="_blank" className="underline">{s.title}</a>
            {i < a.length - 1 ? "; " : "."}
          </span>
        ))}{" "}
        We may earn a commission from these links. <Link href="/affiliate-disclosure" className="underline">Disclosure</Link>.
      </p>
    </div>
  );
}
