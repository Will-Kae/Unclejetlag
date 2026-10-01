import "server-only";
import { getAllArticles, getAllDestinations, getAllVisaBriefs, destinationSlugs } from "@/lib/content";
import { countries, getRegion } from "@/data/countries";
import { sections, sectionList } from "@/data/taxonomy";
import { routes } from "@/lib/routes";
import type { SearchDoc } from "@/lib/search";
import { tools } from "@/data/tools";
import { esimDestinations } from "@/data/esim";

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  const guides = destinationSlugs();

  for (const a of getAllArticles()) {
    docs.push({
      id: `a:${a.category}:${a.slug}`,
      type: "article",
      title: a.title,
      description: a.description,
      url: a.url,
      label: sections[a.category].label,
      keywords: [...a.tags, a.subcategory, ...a.countries, sections[a.category].label].join(" ").toLowerCase(),
      date: a.updatedDate,
    });
  }
  for (const d of getAllDestinations()) {
    const c = countries.find((x) => x.slug === d.country);
    docs.push({
      id: `d:${d.country}`,
      type: "destination",
      title: `${d.countryName} travel guide`,
      description: d.description,
      url: d.url,
      label: "Destination",
      keywords: [d.countryName, ...(c?.aliases ?? []), d.currency.code, d.currency.name, d.capital, "visa entry money budget cost", ...d.tags]
        .join(" ")
        .toLowerCase(),
      date: d.updatedDate,
    });
  }
  for (const v of getAllVisaBriefs()) {
    docs.push({
      id: `v:${v.passport}:${v.destination}`,
      type: "visa",
      title: `${v.destinationName} visa for ${v.passportDemonym} passport holders`,
      description: v.description,
      url: v.url,
      label: "Visa brief",
      keywords: [v.passportName, v.passportDemonym, v.destinationName, "passport visa entry requirements", ...v.tags].join(" ").toLowerCase(),
      date: v.updatedDate,
    });
  }
  for (const s of sectionList) {
    if (s.key === "visas") continue;
    for (const t of s.topics) {
      docs.push({
        id: `t:${s.key}:${t.slug}`,
        type: "topic",
        title: `${t.label}`,
        description: t.description,
        url: routes.topic(s.key, t.slug),
        label: s.label,
        keywords: `${t.label} ${s.label} ${t.slug.replace(/-/g, " ")}`.toLowerCase(),
      });
    }
  }
  for (const t of tools) {
    if (t.status !== "live" || !t.href || t.href.startsWith("http")) continue;
    docs.push({ id: `tool:${t.slug}`, type: "tool", title: t.name, description: t.description, url: t.href, label: "Travel tool", keywords: `${t.name} ${t.category} tool checklist finder`.toLowerCase() });
  }
  docs.push(
    { id: "tool:security", type: "tool", title: "Travel Security", description: "Public Wi-Fi, VPNs, passwords, lost phones, SIM swaps and scams.", url: "/security", label: "Travel Security", keywords: "security wifi wi-fi airport hotel vpn password passkey phone lost stolen sim scam phishing 2fa" },
    { id: "tool:recommends", type: "tool", title: "Uncle Jetlag Recommends", description: "The eSIMs, VPN and password manager we recommend, and how we're paid.", url: "/recommends", label: "Recommends", keywords: "recommends recommendation best esim vpn password manager holafly saily nordvpn nordpass" },
  );
  for (const e of esimDestinations) {
    const c = countries.find((x) => x.slug === e.slug);
    docs.push({
      id: `esim:${e.slug}`,
      type: "esim",
      title: `Best eSIM for ${e.name}`,
      description: e.note,
      url: `/esim/${e.slug}`,
      label: "eSIM",
      keywords: [e.name, e.longName ?? "", ...(c?.aliases ?? []), "esim sim data roaming internet mobile holafly saily"].join(" ").toLowerCase(),
    });
  }
  // Countries without a guide still appear, pointing to their region page.
  for (const c of countries) {
    if (guides.has(c.slug)) continue;
    docs.push({
      id: `c:${c.slug}`,
      type: "country",
      title: c.name,
      description: `Full ${c.name} guide coming soon. Browse ${getRegion(c.region)?.label} destinations.`,
      url: routes.region(c.region),
      label: "Country · guide coming soon",
      keywords: [c.name, ...(c.aliases ?? []), c.demonym ?? ""].join(" ").toLowerCase(),
    });
  }
  return docs;
}
