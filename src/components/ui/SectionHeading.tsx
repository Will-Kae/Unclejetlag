import Link from "next/link";
import { cn } from "@/lib/utils";
import { Arrow } from "./icons";

export function SectionHeading({
  kicker,
  title,
  description,
  href,
  hrefLabel = "See all",
  className,
  as: Tag = "h2",
  id,
}: {
  id?: string;
  kicker?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {kicker && <p className="label-mono mb-3 text-jet-ink">{kicker}</p>}
        <Tag id={id} className="text-[clamp(1.75rem,1.2rem+2vw,2.6rem)] font-semibold leading-[1.08] text-ink">{title}</Tag>
        {description && <p className="mt-3 text-[1.05rem] leading-relaxed text-muted">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-ink">
          <span className="link-underline">{hrefLabel}</span>
          <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
