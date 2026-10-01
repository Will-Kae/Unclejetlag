import Link from "next/link";
import { CoverArt } from "@/components/ui/CoverArt";
import { Badge } from "@/components/ui/Badge";
import { Clock } from "@/components/ui/icons";
import { sections } from "@/data/taxonomy";
import type { ArticleSummary } from "@/lib/content";
import { cn, formatDate } from "@/lib/utils";

const tone = { money: "jet", "travel-tech": "sky", guides: "palm", visas: "amber" } as const;
const codes = { money: "FX", "travel-tech": "SIM", guides: "UJ", visas: "VISA" } as const;

function topicLabel(a: ArticleSummary) {
  return sections[a.category].topics.find((t) => t.slug === a.subcategory)?.label ?? sections[a.category].label;
}

export function ArticleMeta({ a, className }: { a: ArticleSummary; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-muted", className)}>
      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{a.readingTime} min read</span>
      <span aria-hidden="true" className="text-ink/20">•</span>
      <span>Updated <time dateTime={a.updatedDate}>{formatDate(a.updatedDate)}</time></span>
    </p>
  );
}

export function ArticleCard({
  a,
  variant = "default",
  priority,
  headingLevel = "h3",
}: {
  a: ArticleSummary;
  variant?: "default" | "horizontal" | "feature";
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const H = headingLevel;
  const cover = (cls: string, size: "sm" | "md" | "lg" = "md") => (
    <CoverArt
      seed={a.slug}
      code={codes[a.category]}
      src={a.featuredImage?.src}
      alt={a.featuredImage?.alt ?? a.title}
      className={cls}
      priority={priority}
      size={size}
      sizes={variant === "feature" ? "(min-width:1024px) 60vw, 100vw" : "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"}
    />
  );

  if (variant === "horizontal") {
    return (
      <article className="group relative flex gap-4">
        {cover("aspect-square w-24 shrink-0 rounded-xl sm:w-28", "sm")}
        <div className="min-w-0">
          <p className="label-mono text-jet-ink !text-[0.64rem]">{topicLabel(a)}</p>
          <H className="mt-1 font-display text-[1.05rem] font-semibold leading-snug text-ink">
            <Link href={a.url} className="after:absolute after:inset-0 group-hover:text-jet-ink">{a.title}</Link>
          </H>
          <ArticleMeta a={a} className="mt-1.5" />
        </div>
      </article>
    );
  }

  if (variant === "feature") {
    return (
      <article className="group relative grid overflow-hidden rounded-[1.75rem] bg-white shadow-card ring-1 ring-line md:grid-cols-[1.25fr_1fr]">
        {cover("aspect-[16/10] md:aspect-auto md:min-h-[22rem]", "lg")}
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <div className="flex flex-wrap gap-2">
            <Badge tone={tone[a.category]}>{sections[a.category].label}</Badge>
            {a.contentStatus === "demo" && <Badge tone="amber">Demo content</Badge>}
          </div>
          <H className="mt-4 text-[clamp(1.6rem,1.2rem+1.5vw,2.3rem)] font-semibold leading-[1.1] text-ink">
            <Link href={a.url} className="after:absolute after:inset-0 group-hover:text-jet-ink">{a.title}</Link>
          </H>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">{a.description}</p>
          <ArticleMeta a={a} className="mt-5" />
        </div>
      </article>
    );
  }

  return (
    <article className="card-lift group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-card ring-1 ring-line">
      <div className="relative">
        {cover("aspect-[16/10]")}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge tone="glass">{topicLabel(a)}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="label-mono text-jet-ink !text-[0.64rem]">{sections[a.category].label}</p>
        <H className="mt-2 font-display text-[1.2rem] font-semibold leading-snug text-ink">
          <Link href={a.url} className="after:absolute after:inset-0 group-hover:text-jet-ink">{a.title}</Link>
        </H>
        <p className="mt-2 line-clamp-3 text-[0.95rem] leading-relaxed text-muted">{a.description}</p>
        <div className="mt-auto pt-4"><div className="perforation mb-3" /><ArticleMeta a={a} /></div>
      </div>
    </article>
  );
}
