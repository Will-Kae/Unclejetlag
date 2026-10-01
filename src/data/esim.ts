/**
 * Uncle Jetlag eSIM data.
 *
 * IMPORTANT: no live prices, speeds, operators or allowances live here. Provider facts are
 * plan-type features checked by hand on the provider's own pages (see `checked` and `sources`).
 * When a live API becomes available, implement `EsimOfferSource` below and the Finder will
 * render live offers instead of the informational comparison.
 */
import { getPartner } from "./partners";

/** Kept for existing components. Holafly remains the partner with a confirmed reader code. */
export const ESIM_PARTNER = "holafly";
export const ESIM_CODE = getPartner("holafly")?.discount?.code ?? "UNCLEJETLAG";
export const ESIM_DISCOUNT = getPartner("holafly")?.discount?.amount ?? "5% off";

export const ESIM_FACTS_CHECKED = "2026-10-01";

/* ---------------------------------- Providers ---------------------------------- */

export type Fact = { value: string; note?: string } | null; // null = not verified: show "Check with provider"

export type EsimProviderFacts = {
  partner: string; // slug in partners.ts
  planTypes: string;
  unlimited: Fact;
  fixedData: Fact;
  hotspot: Fact;
  topUps: Fact;
  installation: Fact;
  activation: Fact;
  extras: Fact;
  sources: { title: string; url: string }[];
};

export const esimProviders: EsimProviderFacts[] = [
  {
    partner: "holafly",
    planTypes: "Unlimited-data travel eSIMs by number of days",
    unlimited: { value: "Yes", note: "Fair usage policy applies; speeds can be reduced temporarily during heavy use." },
    fixedData: null,
    hotspot: { value: "Limited", note: "On the plans we checked (e.g. Japan), hotspot sharing is capped at 1 GB per day." },
    topUps: null,
    installation: { value: "QR code or app", note: "Install on Wi-Fi before you fly." },
    activation: { value: "When it connects to a supported network in your destination" },
    extras: { value: "Data only, no local number", note: "Use WhatsApp and other internet calling apps." },
    sources: [
      { title: "Holafly Japan eSIM page", url: "https://esim.holafly.com/esim-japan/" },
      { title: "Holafly FAQ", url: "https://esim.holafly.com/faq/" },
    ],
  },
  {
    partner: "saily",
    planTypes: "Fixed-data plans and unlimited plans, managed in the Saily app",
    unlimited: { value: "In selected destinations", note: "Saily lists unlimited plans for 62 countries plus regional plans: 5 GB high-speed per 24 hours, then 1 Mbps." },
    fixedData: { value: "Yes", note: "Plan sizes from 1 GB upwards on the plans we checked (e.g. Europe)." },
    hotspot: { value: "Allowed", note: "Saily says hotspot sharing is unlimited." },
    topUps: { value: "Yes, in the app", note: "Including an auto top-up option." },
    installation: { value: "Saily app" },
    activation: { value: "When you arrive in your destination", note: "Or 180 days after purchase, whichever comes first." },
    extras: { value: "Built-in ad blocking and web protection", note: "Saily says this reduces data use; phone numbers are a separate product." },
    sources: [
      { title: "Saily Europe eSIM", url: "https://saily.com/esim-europe/" },
      { title: "Saily unlimited data", url: "https://saily.com/esim-unlimited-data/" },
    ],
  },
];

/** Comparison rows, in display order. */
export const compareRows: { key: keyof Omit<EsimProviderFacts, "partner" | "planTypes" | "sources">; label: string }[] = [
  { key: "unlimited", label: "Unlimited data" },
  { key: "fixedData", label: "Fixed-data plans" },
  { key: "hotspot", label: "Hotspot / tethering" },
  { key: "topUps", label: "Top-ups" },
  { key: "installation", label: "Installation" },
  { key: "activation", label: "Validity starts" },
  { key: "extras", label: "Worth knowing" },
];

/* ------------------------------- Usage profiles ------------------------------- */

export type UsageLevel = "light" | "regular" | "heavy";

/**
 * Uncle Jetlag rule of thumb, NOT a measurement. Shown with that label.
 * Readers are told to check their phone's own data-usage screen for their real number.
 */
export const usageProfiles: Record<UsageLevel, { label: string; blurb: string; gbPerDay: [number, number]; fit: string }> = {
  light: {
    label: "Light",
    blurb: "Messaging, maps, occasional browsing.",
    gbPerDay: [0.3, 0.7],
    fit: "A small fixed-data plan is usually enough. Top up if you run low.",
  },
  regular: {
    label: "Regular",
    blurb: "Social media, navigation, browsing and calls.",
    gbPerDay: [0.8, 1.5],
    fit: "A mid-size fixed plan or a short unlimited plan. Compare the total cost for your dates.",
  },
  heavy: {
    label: "Heavy",
    blurb: "Streaming, hotspot use, video and constant connectivity.",
    gbPerDay: [2, 4],
    fit: "Unlimited plans make sense, but check the fair-use and hotspot rules first.",
  },
};

/** Which plan types suit a usage level. Based on plan type, never on commission. */
export function planFit(level: UsageLevel, f: EsimProviderFacts): string[] {
  const out: string[] = [];
  if (level === "light" && f.fixedData) out.push("Has fixed-data plans, which suit light use");
  if (level === "regular" && f.fixedData) out.push("Fixed-data plans if you know your usage");
  if (level !== "light" && f.unlimited) out.push(f.unlimited.value === "Yes" ? "Unlimited-data plans" : `Unlimited plans ${f.unlimited.value.toLowerCase()}`);
  if (level === "heavy" && f.hotspot) out.push(`Hotspot: ${f.hotspot.value.toLowerCase()}`);
  if (f.topUps) out.push("Top-ups available");
  return out;
}

/* --------------------------------- Destinations -------------------------------- */

export type EsimDestination = {
  slug: string;
  flag: string;
  name: string;
  /** Long name for headings, e.g. "the United Arab Emirates". */
  longName?: string;
  /** Our destination guide slug, if we have one (pulls quick facts into /esim/[slug]). */
  guide?: string;
  note: string;
  /** Destination-specific connectivity notes. Stable, non-numeric advice only. */
  tips: string[];
};

export const esimDestinations: EsimDestination[] = [
  {
    slug: "united-kingdom",
    flag: "🇬🇧",
    name: "UK",
    longName: "the United Kingdom",
    guide: "united-kingdom",
    note: "Maps, contactless and Uber from the moment you clear the airport.",
    tips: [
      "London's Underground has Wi-Fi at many stations, but mobile data is what gets you from the airport to your hotel.",
      "Contactless card and phone payments work almost everywhere, so you'll lean on your phone more than you expect.",
      "Rural Scotland and Wales can have patchy coverage. Download offline maps before a road trip.",
    ],
  },
  {
    slug: "usa",
    flag: "🇺🇸",
    name: "USA",
    longName: "the USA",
    note: "Road trips, ride-hailing and a lot of ground to cover.",
    tips: [
      "Distances are huge and national parks often have little or no signal. Offline maps are not optional.",
      "Many US services send verification codes by SMS. Keep your home SIM active for those.",
      "Ride-hailing apps assume you have data at the kerb, including at airports.",
    ],
  },
  {
    slug: "south-africa",
    flag: "🇿🇦",
    name: "South Africa",
    guide: "south-africa",
    note: "Skip the RICA paperwork for a local SIM on arrival.",
    tips: [
      "Local SIM cards must be registered under RICA, which takes ID and proof of address. An eSIM bought before you fly avoids the counter.",
      "Coverage is strong in the cities and along main routes; game reserves and remote areas can be patchy. Keep offline maps.",
      "Ride-hailing is the default way to get around cities after dark, so plan to have data from the airport.",
    ],
  },
  {
    slug: "united-arab-emirates",
    flag: "🇦🇪",
    name: "Dubai & UAE",
    longName: "Dubai and the UAE",
    guide: "united-arab-emirates",
    note: "Metro, taxis and maps sorted before you step into the heat.",
    tips: [
      "Some internet calling features are restricted in the UAE. Check which apps work before relying on them for calls.",
      "Taxis and ride-hailing apps are the norm in Dubai; data from arrival saves a lot of hassle.",
      "Free Wi-Fi in malls and hotels is common, but sign-ups can ask for a phone number or email.",
    ],
  },
  {
    slug: "thailand",
    flag: "🇹🇭",
    name: "Thailand",
    note: "Island hops, Grab rides and translation on the go.",
    tips: [
      "Grab and Bolt are the easiest way to avoid taxi haggling, and both need data.",
      "Island ferries and remote beaches can lose signal. Download maps and booking confirmations offline.",
      "Translation apps with camera mode are worth the data for menus and signs.",
    ],
  },
  {
    slug: "europe",
    flag: "🇪🇺",
    name: "Europe",
    note: "One eSIM for a multi-country trip instead of a SIM per border.",
    tips: [
      "EU \"roam like at home\" rules protect EU SIM customers, not visitors on non-EU SIMs. Your home roaming may still be expensive.",
      "A regional plan covers several countries, but check the exact country list: some non-EU countries are excluded.",
      "Trains between countries cross borders quickly. A regional eSIM avoids a coverage gap at each border.",
    ],
  },
  {
    slug: "japan",
    flag: "🇯🇵",
    name: "Japan",
    note: "Train apps and offline-proof maps for complicated stations.",
    tips: [
      "Big stations are mazes. Live maps and transit apps save real time.",
      "Many places in Japan still prefer cash or IC cards; your phone matters most for navigation and translation.",
      "Pocket Wi-Fi rentals are still common, but an eSIM means one less device to charge and return.",
    ],
  },
  {
    slug: "georgia",
    flag: "🇬🇪",
    name: "Georgia",
    guide: "georgia",
    note: "Tbilisi to the mountains without hunting for a SIM shop.",
    tips: [
      "Coverage is good in Tbilisi and Batumi; mountain roads to Kazbegi and Svaneti can have gaps.",
      "Bolt is widely used in Tbilisi and Batumi and needs data.",
      "Georgia now requires travel medical insurance for visitors. Keep your policy saved offline on your phone.",
    ],
  },
];

export function getEsimDestination(slug: string) {
  return esimDestinations.find((d) => d.slug === slug);
}

/* ------------------------------ Future: live offers ------------------------------ */

/** Shape a live pricing API would return. Not implemented: no reliable live feed exists yet. */
export type EsimOffer = { partner: string; destination: string; dataGb: number | "unlimited"; days: number; price: { amount: number; currency: string }; url: string; fetchedAt: string };
export interface EsimOfferSource {
  getOffers(destination: string, days: number): Promise<EsimOffer[]>;
}
