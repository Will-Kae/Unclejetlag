import Link from "next/link";
import { getPartner, goHref, publicDiscount } from "@/data/partners";
import { CodeCopy } from "@/components/esim/CodeCopy";
import { ArrowUpRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export const relationshipLabel = {
  affiliate: "Affiliate partner",
  editorial: "Editorial pick",
  sponsored: "Sponsored",
  related: "Owned by our founder",
} as const;

/**
 * Partner recommendation card. Pulls everything (URL, code, CTA) from src/data/partners.ts.
 * Always shows the relationship and a one-line disclosure.
 */
export function PartnerCard({
  slug,
  placement,
  destination,
  why,
  className,
  tone = "light",
}: {
  slug: string;
  placement: string;
  destination?: string;
  /** Why this fits the reader's situation. Editorial, not partner copy. */
  why?: string[];
  className?: string;
  tone?: "light" | "dark";
}) {
  const p = getPartner(slug);
  if (!p || !p.active) return null;
  const discount = publicDiscount(p);
  const dark = tone === "dark";
  return (
    <article className={cn("flex flex-col rounded-2xl p-6 ring-1", dark ? "bg-white/5 text-paper ring-white/10" : "bg-white ring-line", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("font-display text-2xl font-semibold", dark ? "text-paper" : "text-ink")}>{p.name}</p>
          <p className={cn("mt-1 text-[0.95rem]", dark ? "text-paper/70" : "text-muted")}>{p.tagline}</p>
        </div>
        <span className={cn("label-mono shrink-0 rounded-full px-2.5 py-1 !text-[0.58rem]", dark ? "bg-white/10 text-paper/80" : "bg-sand text-ink-2")}>
          {relationshipLabel.affiliate}
        </span>
      </div>
      {why && why.length > 0 && (
        <ul className={cn("mt-4 space-y-1.5 text-[0.93rem]", dark ? "text-paper/85" : "text-ink-2")}>
          {why.map((w) => (
            <li key={w} className="flex gap-2"><span aria-hidden="true" className="text-jet">✓</span>{w}</li>
          ))}
        </ul>
      )}
      {discount && (
        <div className="mt-5">
          <p className={cn("text-sm font-semibold", dark ? "text-paper" : "text-ink")}>Save {discount.amount.replace(/ off$/, "")} · {discount.appliesTo}</p>
          <CodeCopy code={discount.code!} partner={p.slug} placement={placement} dark={dark} className="mt-2" />
        </div>
      )}
      <div className="mt-auto pt-6">
        <a
          href={goHref(p.slug, { d: destination, placement })}
          target="_blank"
          rel="sponsored nofollow noopener"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-jet px-5 text-[0.95rem] font-semibold text-white transition hover:bg-jet-ink sm:w-auto"
        >
          {p.cta} on {p.name} <ArrowUpRight className="h-4 w-4" />
        </a>
        <p className={cn("mt-3 text-xs", dark ? "text-paper/55" : "text-muted")}>
          Prices and plans are on {p.name}&apos;s site. We may earn a commission; your price is the same.{" "}
          <Link href="/affiliate-disclosure" className="underline">Disclosure</Link>
        </p>
      </div>
    </article>
  );
}
