import Link from "next/link";
import { categoryMeta, type AccessCategory } from "@/lib/passport/types";

export const PI = "/passport-index";
export const profileHref = (slug: string) => `${PI}/passports/${slug}`;

export const subnav = [
  { label: "Overview", href: PI },
  { label: "Passports", href: `${PI}/passports` },
  { label: "Rankings", href: `${PI}/rankings` },
  { label: "Compare", href: `${PI}/compare` },
  { label: "Africa", href: `${PI}/africa` },
  { label: "Changes", href: `${PI}/changes` },
  { label: "Methodology", href: `${PI}/methodology` },
  { label: "Sources", href: `${PI}/data-sources` },
  { label: "FAQ", href: `${PI}/faq` },
];

export function SubNav({ current }: { current: string }) {
  return (
    <nav aria-label="Passport Index sections" className="border-b border-line bg-white">
      <ul className="container-uj flex gap-1 overflow-x-auto py-2">
        {subnav.map((s) => (
          <li key={s.href} className="shrink-0">
            <Link href={s.href} aria-current={s.href === current ? "page" : undefined} className={`block rounded-full px-3 py-1.5 text-sm font-semibold ${s.href === current ? "bg-ink text-paper" : "text-ink-2 hover:bg-sand"}`}>{s.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Category label with a shape marker so meaning never relies on colour alone. */
export function CategoryPill({ category }: { category: AccessCategory }) {
  const m = categoryMeta[category];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: m.colour }}>
      <span aria-hidden="true" className="font-mono">{m.short}</span>
      <span>{m.label}</span>
    </span>
  );
}

export function CoverageBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 1000) / 10;
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-ink-2">{label}</span><span className="font-semibold text-ink">{pct}%</span></div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-palm" style={{ width: `${Math.max(pct, 0.5)}%` }} />
      </div>
    </div>
  );
}

export function NotRanked() {
  return (
    <p className="rounded-2xl border border-dashed border-ink/25 bg-white p-4 text-[0.95rem] text-ink-2">
      <strong className="text-ink">Data verification in progress.</strong> We only score a passport once at least 95% of its destinations are verified on official sources, so this passport has no rank yet. Counts below cover verified destinations only.
    </p>
  );
}

export const h2 = "text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-semibold text-ink";
