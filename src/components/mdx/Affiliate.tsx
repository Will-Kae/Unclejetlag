import Link from "next/link";
import { getPartner } from "@/data/partners";
import { routes } from "@/lib/routes";
import { ArrowUpRight, Check, Minus } from "@/components/ui/icons";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/** Outbound partner CTA. Always routes via /go/[partner] and carries rel="sponsored". */
export function AffiliateButton({ partner, children, variant = "primary" }: { partner: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  const p = getPartner(partner);
  return (
    <a
      href={routes.partner(partner)}
      rel="sponsored nofollow noopener"
      target="_blank"
      data-plain
      data-partner={partner}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.95rem] font-semibold no-underline transition",
        variant === "primary" ? "bg-jet text-white hover:bg-jet-ink" : "border border-ink/15 bg-white text-ink hover:border-ink/40",
      )}
    >
      {children}
      <ArrowUpRight className="h-4 w-4" />
      {p && !p.active && <span className="sr-only">(demo link)</span>}
    </a>
  );
}

export function AffiliateDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <aside role="note" className={cn("not-prose rounded-xl border border-line bg-white/70 text-sm leading-relaxed text-muted", compact ? "px-4 py-3" : "my-6 px-5 py-4")}>
      <strong className="text-ink">Transparency note:</strong> Some links on this page are affiliate links. If you buy through them, Uncle
      Jetlag may earn a commission at no extra cost to you. It never changes what we recommend.{" "}
      <Link href="/affiliate-disclosure" className="font-medium text-sky underline">How we make money</Link>.
    </aside>
  );
}

export function ProsCons({ pros, cons, title }: { pros: string[]; cons: string[]; title?: string }) {
  return (
    <div className="not-prose my-8">
      {title && <p className="mb-3 font-display text-lg font-semibold text-ink">{title}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-palm-soft/70 p-5 ring-1 ring-palm/15">
          <p className="label-mono text-palm">The good</p>
          <ul className="mt-3 space-y-2">
            {pros.map((p) => (
              <li key={p} className="flex gap-2.5 text-[0.95rem] leading-snug text-ink-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-palm" />{p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-jet-soft/60 p-5 ring-1 ring-jet/15">
          <p className="label-mono text-jet-ink">The catch</p>
          <ul className="mt-3 space-y-2">
            {cons.map((c) => (
              <li key={c} className="flex gap-2.5 text-[0.95rem] leading-snug text-ink-2"><Minus className="mt-0.5 h-4 w-4 shrink-0 text-jet-ink" />{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** "Uncle Jetlag Pick" product card. */
export function PickCard({
  name,
  partner,
  bestFor,
  summary,
  pros = [],
  cons = [],
  price,
  cta = "Check current prices",
  badge = "Uncle Jetlag Pick",
  demo = false,
}: {
  name: string;
  partner: string;
  bestFor: string;
  summary: string;
  pros?: string[];
  cons?: string[];
  price?: string;
  cta?: string;
  badge?: string;
  demo?: boolean;
}) {
  return (
    <div className="not-prose relative my-9 overflow-hidden rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-7">
      <div aria-hidden="true" className="absolute right-0 top-0 h-28 w-28 translate-x-10 -translate-y-10 rounded-full bg-jet/15" />
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ink">★ {badge}</Badge>
        {demo && <Badge tone="amber">Demo product</Badge>}
      </div>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{name}</p>
      <p className="label-mono mt-1 text-muted">Best for · {bestFor}</p>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-2">{summary}</p>
      {(pros.length > 0 || cons.length > 0) && (
        <div className="mt-4 grid gap-2 text-[0.93rem] sm:grid-cols-2">
          <ul className="space-y-1.5">{pros.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-palm" />{p}</li>)}</ul>
          <ul className="space-y-1.5">{cons.map((c) => <li key={c} className="flex gap-2"><Minus className="mt-0.5 h-4 w-4 shrink-0 text-jet-ink" />{c}</li>)}</ul>
        </div>
      )}
      <div className="perforation my-5" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        {price ? <p className="text-sm text-muted">{price}</p> : <span />}
        <AffiliateButton partner={partner}>{cta}</AffiliateButton>
      </div>
    </div>
  );
}
