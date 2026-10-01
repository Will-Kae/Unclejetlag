import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { tools, toolCategories } from "@/data/tools";
import { goHref } from "@/data/partners";
import { relationshipLabel } from "@/components/partners/PartnerCard";
import { ArrowUpRight, Arrow } from "@/components/ui/icons";
import { buildMetadata, collectionLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/JsonLd";

export const metadata: Metadata = buildMetadata({
  title: "Travel Tools: eSIM Finder, Before You Fly Checklist & More",
  description: "The Uncle Jetlag travel toolkit: eSIM Finder, Before You Fly checklist, visa finder, currency converter and travel security tools.",
  path: "/tools",
  ogKicker: "Travel Tools",
});

export default function ToolsPage() {
  const live = tools.filter((t) => t.status === "live");
  return (
    <>
      <section className="border-b border-line">
        <div className="container-uj pb-12 pt-6 sm:pt-8">
          <Breadcrumbs items={[{ name: "Travel Tools", href: "/tools" }]} />
          <div className="mt-10 max-w-3xl">
            <p className="label-mono text-jet-ink">The Uncle Jetlag toolkit</p>
            <h1 className="mt-3 text-[clamp(2.4rem,1.5rem+3.8vw,4.4rem)] font-semibold uppercase leading-[0.95] tracking-[-0.03em]">Travel tools</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              The things worth sorting before you leave, in one place. Some are our own tools, some are products we recommend. Each one is labelled,
              so you always know which is which.
            </p>
          </div>
        </div>
      </section>

      <div className="container-uj">
        {toolCategories.map((c) => {
          const items = tools.filter((t) => t.category === c.key);
          if (!items.length) return null;
          return (
            <section key={c.key} aria-labelledby={`cat-${c.key}`} className="mt-16">
              <div className="flex flex-col gap-2 border-b border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 id={`cat-${c.key}`} className="font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold">{c.label}</h2>
                <p className="text-muted">{c.intro}</p>
              </div>
              <ul className="mt-2 divide-y divide-line">
                {items.map((t) => {
                  const href = t.partner ? goHref(t.partner, { placement: "tools-hub" }) : t.href;
                  const external = Boolean(t.partner) || (t.href?.startsWith("http") ?? false);
                  const body = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-xl font-semibold text-ink">{t.name}</span>
                          {t.relationship && (
                            <span className="label-mono rounded-full bg-sand px-2 py-0.5 !text-[0.55rem] text-ink-2">{relationshipLabel[t.relationship]}</span>
                          )}
                          {t.status === "soon" && <span className="label-mono rounded-full border border-dashed border-ink/25 px-2 py-0.5 !text-[0.55rem] text-muted">Coming soon</span>}
                        </span>
                        {t.description && <span className="mt-1 block text-[0.95rem] text-muted">{t.description}</span>}
                      </span>
                      {href && (external ? <ArrowUpRight className="h-5 w-5 shrink-0 text-ink" /> : <Arrow className="h-5 w-5 shrink-0 text-ink transition group-hover:translate-x-1" />)}
                    </>
                  );
                  return (
                    <li key={t.slug}>
                      {href && t.status === "live" ? (
                        external ? (
                          <a
                            href={href}
                            target="_blank"
                            rel={t.partner ? "sponsored nofollow noopener" : "noopener"}
                            data-track="travel_tool_open"
                            data-tool={t.slug}
                            className="group flex items-center gap-6 py-5 transition hover:bg-white/60"
                          >
                            {body}
                          </a>
                        ) : (
                          <Link href={href} data-track="travel_tool_open" data-tool={t.slug} className="group flex items-center gap-6 py-5 transition hover:bg-white/60">
                            {body}
                          </Link>
                        )
                      ) : (
                        <div className="flex items-center gap-6 py-5 [&_.font-display]:text-ink-2">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        <p className="mt-12 max-w-3xl text-sm text-muted">
          Affiliate partners may pay Uncle Jetlag a commission if you buy through our links, at no extra cost to you. QeFX is owned by our founder.
          Neither changes what we recommend. <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link>.
        </p>
      </div>
      <JsonLd data={collectionLd("Travel Tools", "The Uncle Jetlag travel toolkit", "/tools", live.filter((t) => t.href && !t.href.startsWith("http")).map((t) => ({ name: t.name, url: t.href! })))} />
    </>
  );
}
