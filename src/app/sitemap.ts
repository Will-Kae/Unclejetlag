import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";
import { getAllArticles, getAllDestinations, getAllPages, getAllVisaBriefs, getArticlesByTopic, isIndexable } from "@/lib/content";
import { sectionList } from "@/data/taxonomy";
import { regions } from "@/data/countries";
import { routes } from "@/lib/routes";
import { esimDestinations } from "@/data/esim";

/** Only indexable (editor-verified) content is listed. Hubs are always listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${SITE_URL}${p}`;
  const articles = getAllArticles().filter(isIndexable);
  const latest = [...articles, ...getAllDestinations(), ...getAllVisaBriefs()].map((x) => x.updatedDate).sort().at(-1);
  const hub = (path: string, priority = 0.8): MetadataRoute.Sitemap[number] => ({ url: u(path), lastModified: latest, changeFrequency: "daily", priority });

  return [
    hub("/", 1),
    hub(routes.destinations()),
    ...regions.filter((r) => getAllDestinations().some((d) => d.region === r.key)).map((r) => hub(routes.region(r.key), 0.6)),
    hub(routes.visas()),
    hub("/updates", 0.9),
    hub("/esim", 0.9),
    hub("/tools", 0.8),
    hub("/tools/before-you-fly", 0.8),
    hub("/security", 0.8),
    hub("/insurance", 0.8),
    hub("/banking", 0.8),
    hub("/recommends", 0.6),
    ...esimDestinations.filter((e) => e.guide).map((e) => hub(`/esim/${e.slug}`, 0.7)),
    ...sectionList.filter((s) => s.key !== "visas").flatMap((s) => [hub(s.path), ...s.topics.filter((t) => getArticlesByTopic(s.key, t.slug).length > 0).map((t) => hub(routes.topic(s.key, t.slug), 0.5))]),
    ...articles.map((a) => ({ url: u(a.url), lastModified: a.updatedDate, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...getAllDestinations().filter(isIndexable).map((d) => ({ url: u(d.url), lastModified: d.updatedDate, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...getAllVisaBriefs().filter(isIndexable).map((v) => ({ url: u(v.url), lastModified: v.updatedDate, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...getAllPages().map((p) => ({ url: u(p.url), lastModified: p.updatedDate, changeFrequency: "yearly" as const, priority: 0.3 })),
    { url: u("/about"), changeFrequency: "yearly", priority: 0.4 },
    { url: u("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: u("/faq"), changeFrequency: "monthly", priority: 0.5 },
    { url: u("/photo-credits"), changeFrequency: "monthly", priority: 0.2 },
    { url: u("/authors/uncle-jetlag"), changeFrequency: "monthly", priority: 0.4 },
  ];
}
