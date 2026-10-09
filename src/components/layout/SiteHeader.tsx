import { Header, type MegaPanel } from "./Header";
import { regions } from "@/data/countries";
import { sections } from "@/data/taxonomy";
import { getAllDestinations, getAllVisaBriefs, getArticlesBySection } from "@/lib/content";
import { routes } from "@/lib/routes";

/** Server wrapper: builds mega-menu data from content, passes plain props to the client header. */
export function SiteHeader() {
  const dest = getAllDestinations();
  const visas = getAllVisaBriefs();
  const firstOf = (k: "money" | "travel-tech" | "guides") => getArticlesBySection(k)[0];

  const topicPanel = (k: "money" | "travel-tech" | "guides", intro: string): MegaPanel => {
    const s = sections[k];
    const half = Math.ceil(s.topics.length / 2);
    const f = firstOf(k);
    return {
      key: k,
      label: s.label,
      href: s.path,
      intro,
      columns: [
        { title: "Topics", links: s.topics.slice(0, half).map((t) => ({ label: t.label, href: routes.topic(k, t.slug) })) },
        { title: "More topics", links: s.topics.slice(half).map((t) => ({ label: t.label, href: routes.topic(k, t.slug) })) },
      ],
      feature: f ? { title: f.title, href: f.url, kicker: "Latest" } : undefined,
    };
  };

  const panels: MegaPanel[] = [
    {
      key: "destinations",
      label: "Destinations",
      href: routes.destinations(),
      intro: "Country guides built around the questions you actually have before you land.",
      columns: [
        { title: "Regions", links: regions.map((r) => ({ label: r.label, href: routes.region(r.key) })) },
        { title: "Country guides", links: dest.map((d) => ({ label: d.countryName, href: d.url, hint: d.currency.code })) },
      ],
      feature: dest[0] ? { title: `${dest.find((d) => d.country === "georgia")?.countryName ?? dest[0].countryName}: the full intelligence brief`, href: routes.destination(dest.find((d) => d.country === "georgia")?.country ?? dest[0].country), kicker: "Featured destination" } : undefined,
    },
    {
      key: "visas",
      label: "Visas & Passports",
      href: routes.visas(),
      intro: "Entry rules organised by the passport you hold, always linked to official sources.",
      columns: [
        { title: "Passport briefs", links: visas.slice(0, 6).map((v) => ({ label: `${v.passportName} → ${v.destinationName}`, href: v.url })) },
        { title: "Visa basics", links: getArticlesBySection("visas").slice(0, 5).map((a) => ({ label: a.title, href: a.url })) },
      ],
      feature: { title: "Find what your passport needs: pick a passport and a destination.", href: `${routes.visas()}#finder`, kicker: "Visa finder" },
    },
    { ...topicPanel("money", "Banking, cards, cash and transfers: how money really moves across borders."), label: "Money" },
    {
      key: "tools",
      label: "Travel Tools",
      href: "/tools",
      intro: "Useful even if you never buy a thing: checklists, finders and converters for the admin around a trip.",
      columns: [
        {
          title: "Tools",
          links: [
            { label: "Before You Fly checklist", href: "/tools/before-you-fly" },
            { label: "eSIM Finder", href: "/esim" },
            { label: "Visa finder", href: "/visas#finder" },
            { label: "Currency converter (QeFX)", href: "https://converter.qefxmoney.com" },
            { label: "All travel tools", href: "/tools" },
          ],
        },
        {
          title: "Connect & protect",
          links: [
            { label: "eSIMs by destination", href: "/esim#dest" },
            { label: "Travel Insurance", href: "/insurance" },
            { label: "Banking & SWIFT codes", href: "/banking" },
            { label: "Travel Security", href: "/security" },
            { label: "Public Wi-Fi & VPNs", href: "/security#vpn" },
            { label: "Uncle Jetlag Recommends", href: "/recommends" },
          ],
        },
      ],
      feature: { title: "Land connected: find the right eSIM before your plane touches down.", href: "/esim", kicker: "eSIM Finder" },
    },
    {
      key: "smarter",
      label: "Travel Smarter",
      href: "/guides",
      intro: "Travel tech, planning and the hard-won lessons, plus the rule changes that matter this week.",
      columns: [
        { title: sections["travel-tech"].label, links: sections["travel-tech"].topics.slice(0, 6).map((t) => ({ label: t.label, href: routes.topic("travel-tech", t.slug) })) },
        { title: sections.guides.label, links: [...sections.guides.topics.slice(0, 5).map((t) => ({ label: t.label, href: routes.topic("guides", t.slug) })), { label: "Latest updates", href: "/updates" }] },
      ],
      feature: { title: "What changed for travellers this week", href: "/updates", kicker: "Updates" },
    },
  ];
  panels[1] = { ...panels[1], label: "Visas" };

  return <Header panels={panels} links={[{ label: "eSIM", href: "/esim" }, { label: "Insurance", href: "/insurance" }, { label: "Banking", href: "/banking" }, { label: "Security", href: "/security" }]} />;
}
