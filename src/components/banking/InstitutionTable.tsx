import Link from "next/link";
import type { Institution } from "@/lib/banking/directory";
import { isDatedSource } from "@/lib/banking/directory";
import { formatDate } from "@/lib/utils";
import { bankHref } from "./countrySlug";

/** Server-rendered table of directory records. Every row shows its source and check date. */
export function InstitutionTable({ items }: { items: Institution[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
      <table className="w-full min-w-[34rem] text-left text-[0.95rem]">
        <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Bank</th>
            <th scope="col" className="px-4 py-3 font-semibold">SWIFT/BIC</th>
            <th scope="col" className="px-4 py-3 font-semibold">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((inst) => {
            const href = bankHref(inst.country, inst.slug);
            return (
              <tr key={inst.id} className="align-top">
                <td className="px-4 py-3 text-ink">{href ? <Link href={href} className="font-semibold hover:underline">{inst.name}</Link> : inst.name}</td>
                <td className="px-4 py-3">
                  {inst.identifiers.map((i) => (
                    <span key={i.value} className="block">
                      <span className="font-mono font-semibold tracking-wide text-ink">{i.value}</span>
                      {i.scope && <span className="block text-xs text-muted">{i.scope}</span>}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3 text-sm">
                  {inst.identifiers.map((i, n) => (
                    <span key={i.value + n} className="block">
                      <a href={i.source.url} target="_blank" rel="noopener nofollow" className="text-sky underline">{i.source.type === "central-bank" ? "Central bank" : "Bank website"}</a>
                      <span className="text-muted"> · {formatDate(i.source.checked)}</span>
                      {isDatedSource(i.source) && <span className="block text-xs font-semibold text-amber">Published {i.source.published}: confirm with the bank</span>}
                    </span>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
