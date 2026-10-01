import Link from "next/link";
import { CoverArt } from "@/components/ui/CoverArt";
import { getRegion } from "@/data/countries";
import { formatDate } from "@/lib/utils";

export function CountryCard({
  name,
  href,
  iso2,
  region,
  meta,
  updatedDate,
  comingSoon,
  src,
}: {
  name: string;
  href: string;
  iso2: string;
  region: string;
  meta?: string;
  updatedDate?: string;
  comingSoon?: boolean;
  src?: string;
}) {
  const r = getRegion(region);
  return (
    <article className="card-lift group relative overflow-hidden rounded-[var(--radius-card)] bg-white shadow-card ring-1 ring-line">
      <CoverArt seed={name} code={iso2} palette={r?.hue} src={src} alt={`${name} destination cover`} className="aspect-[4/3]" caption={r?.label} />
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-ink">
          <Link href={href} className="after:absolute after:inset-0 group-hover:text-jet-ink">{name}</Link>
        </h3>
        <p className="mt-1 text-sm text-muted">
          {comingSoon ? "Full guide coming soon" : meta}
          {updatedDate && <> · Updated <time dateTime={updatedDate}>{formatDate(updatedDate)}</time></>}
        </p>
      </div>
    </article>
  );
}
