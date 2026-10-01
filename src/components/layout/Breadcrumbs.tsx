import Link from "next/link";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbLd, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.href} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="line-clamp-1 font-medium text-ink">{c.name}</span>
                ) : (
                  <>
                    <Link href={c.href} className="hover:text-ink hover:underline">{c.name}</Link>
                    <span aria-hidden="true" className="text-ink/25">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(all)} />
    </>
  );
}
