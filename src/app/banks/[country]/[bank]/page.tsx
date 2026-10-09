import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolHero, Disclaimer } from "@/components/banking/ToolHero";
import { CopyButton } from "@/components/banking/ui";
import { ArrowUpRight } from "@/components/ui/icons";
import { countryGuides, getCountryGuide, ibanSummary } from "@/lib/banking/countries";
import { getInstitution, institutionsIn, isDatedSource } from "@/lib/banking/directory";
import { parseBic } from "@/lib/banking/bic";
import { countryName, flag } from "@/lib/banking/iso-countries";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const dynamicParams = false;

/** Only real directory records get a page. */
export function generateStaticParams() {
  return countryGuides.flatMap((g) => institutionsIn(g.code).map((i) => ({ country: g.slug, bank: i.slug })));
}

async function load(params: PageProps<"/banks/[country]/[bank]">["params"]) {
  const p = await params;
  const g = getCountryGuide(p.country);
  const inst = g ? getInstitution(g.code, p.bank) : undefined;
  return g && inst ? { g, inst } : null;
}

export async function generateMetadata({ params }: PageProps<"/banks/[country]/[bank]">): Promise<Metadata> {
  const r = await load(params);
  if (!r) return {};
  const codes = r.inst.identifiers.map((i) => i.value).join(", ");
  return buildMetadata({
    title: `${r.inst.name} SWIFT/BIC Code: ${codes}`,
    description: `${r.inst.name} (${countryName(r.g.code)}) SWIFT/BIC code ${codes}, taken from an official source with the date we checked it. ${ibanSummary(r.g.code)}`,
    path: `/banks/${r.g.slug}/${r.inst.slug}`,
    ogKicker: `Global Banking · ${countryName(r.g.code)}`,
  });
}

export default async function BankPage({ params }: PageProps<"/banks/[country]/[bank]">) {
  const r = await load(params);
  if (!r) notFound();
  const { g, inst } = r;
  const name = countryName(g.code);

  return (
    <>
      <ToolHero
        crumbs={[{ name: "Travel Tools", href: "/tools" }, { name: "Global Banking", href: "/tools/global-banking" }, { name, href: `/banks/${g.slug}` }, { name: inst.name, href: `/banks/${g.slug}/${inst.slug}` }]}
        kicker={`${flag(g.code)} ${name} · Bank directory`}
        title={`${inst.name} SWIFT/BIC code`}
        intro={<>The code{inst.identifiers.length > 1 ? "s" : ""} below {inst.identifiers.length > 1 ? "were" : "was"} read on an official source. Confirm with {inst.name} before sending money: banks can use different codes for specific currencies or branches.</>}
      />

      <div className="container-uj mt-12">
        <article className="max-w-[48rem] space-y-10 text-[1.05rem] leading-relaxed text-ink-2">
          {inst.identifiers.map((id) => {
            const { parts } = parseBic(id.value);
            return (
              <section key={id.value} className="rounded-[var(--radius-card)] bg-white p-5 shadow-card ring-1 ring-line sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-2xl font-semibold tracking-wider text-ink">{id.value}</p>
                  <CopyButton value={id.value} label="Copy code" />
                </div>
                {id.scope && <p className="mt-2 text-[0.95rem] font-semibold text-ink">{id.scope}</p>}
                {parts && (
                  <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line sm:grid-cols-4">
                    {[
                      ["Institution", parts.institution],
                      ["Country", `${parts.country} · ${parts.countryName}`],
                      ["Location", parts.location],
                      ["Branch", parts.branch ? (parts.branch === "XXX" ? "XXX (head office)" : parts.branch) : "Head office"],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white p-3">
                        <dt className="label-mono text-[0.65rem] text-muted">{k}</dt>
                        <dd className="mt-1 font-mono text-[0.95rem] text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className="mt-5 text-sm">
                  Source:{" "}
                  <a href={id.source.url} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1 text-sky underline">
                    {id.source.title}<ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <span className="text-muted"> · {id.source.type === "central-bank" ? "central bank" : "bank website"} · checked {formatDate(id.source.checked)}{id.source.published && ` · published ${id.source.published}`}</span>
                </p>
                {isDatedSource(id.source) && <p className="mt-2 text-sm font-semibold text-amber">This source is several years old. Confirm the code with the bank.</p>}
              </section>
            );
          })}

          {inst.notes && inst.notes.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-ink">Good to know</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">{inst.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-semibold text-ink">Receiving money into {inst.name}</h2>
            <p className="mt-3">{ibanSummary(g.code)} See <Link href={`/banks/${g.slug}`} className="text-sky underline">banking in {name}</Link> for the full list of details a sender needs.</p>
            <p className="mt-3">We don&apos;t list branch addresses, account details or routing numbers. Get those from {inst.name} directly.</p>
          </section>

          <p className="text-[0.95rem]"><Link href="/tools/swift-code-checker" className="text-sky underline">Check another SWIFT/BIC code</Link> · <Link href="/tools/bank-directory" className="text-sky underline">Full bank directory</Link></p>
          <Disclaimer />
        </article>
      </div>
    </>
  );
}
