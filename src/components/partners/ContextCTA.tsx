import Link from "next/link";
import { getPartner, goHref } from "@/data/partners";
import { ArrowUpRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Contextual, educate-first partner prompt (e.g. NordVPN under a public Wi-Fi section).
 * The heading and copy are editorial; the partner is the suggested tool, not the point.
 */
export function ContextCTA({
  slug,
  placement,
  kicker,
  title,
  children,
  label,
  className,
}: {
  slug: string;
  placement: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const p = getPartner(slug);
  if (!p?.active) return null;
  return (
    <aside aria-label={`${p.name} suggestion`} className={cn("not-prose rounded-2xl border border-ink/10 bg-paper p-6", className)}>
      <p className="label-mono text-sky">{kicker}</p>
      <p className="mt-2 font-display text-xl font-semibold leading-snug text-ink">{title}</p>
      <div className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{children}</div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={goHref(p.slug, { placement })}
          target="_blank"
          rel="sponsored nofollow noopener"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[0.95rem] font-semibold text-paper transition hover:bg-jet"
        >
          {label ?? p.cta} <ArrowUpRight className="h-4 w-4" />
        </a>
        <span className="text-xs text-muted">
          {p.name} is an affiliate partner. We may earn a commission at no extra cost to you.{" "}
          <Link href="/affiliate-disclosure" className="underline">Disclosure</Link>
        </span>
      </div>
    </aside>
  );
}
