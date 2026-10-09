import { countryGuides } from "@/lib/banking/countries";

export function countryHref(code: string): string | null {
  const g = countryGuides.find((c) => c.code === code);
  return g ? `/banks/${g.slug}` : null;
}

export function bankHref(country: string, slug: string): string | null {
  const c = countryHref(country);
  return c ? `${c}/${slug}` : null;
}
