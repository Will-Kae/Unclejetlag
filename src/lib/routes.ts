import type { SectionKey } from "@/data/taxonomy";

/** Single source of truth for URLs. Never hand-build content URLs in components. */
export const routes = {
  home: () => "/",
  search: (q?: string) => (q ? `/search?q=${encodeURIComponent(q)}` : "/search"),
  destinations: () => "/destinations",
  region: (region: string) => `/destinations/region/${region}`,
  destination: (country: string) => `/destinations/${country}`,
  visas: () => "/visas",
  visaPassport: (passport: string) => `/visas/${passport}`,
  visaBrief: (passport: string, destination: string) => `/visas/${passport}/${destination}`,
  section: (section: SectionKey) => (section === "visas" ? "/visas" : `/${section}`),
  topic: (section: SectionKey, topic: string) =>
    section === "visas" ? `/visas#guides` : `/${section}/topics/${topic}`,
  article: (section: SectionKey, slug: string) =>
    section === "visas" ? `/visas/guides/${slug}` : `/${section}/${slug}`,
  author: (slug: string) => `/authors/${slug}`,
  partner: (slug: string) => `/go/${slug}`,
};
