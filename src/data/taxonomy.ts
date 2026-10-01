export type SectionKey = "money" | "travel-tech" | "guides" | "visas";

export type Topic = { slug: string; label: string; description: string };

export type Section = {
  key: SectionKey;
  label: string;
  path: string;
  kicker: string;
  title: string;
  description: string;
  accent: string; // tailwind bg class for accents
  topics: Topic[];
};

export const sections: Record<SectionKey, Section> = {
  money: {
    key: "money",
    label: "Money Abroad",
    path: "/money",
    kicker: "Money Abroad",
    title: "Money abroad, minus the nasty surprises",
    description:
      "Banking, cards, cash, exchange rates and transfers: how money actually moves when you cross a border, and how to stop leaking it in fees.",
    accent: "bg-jet",
    topics: [
      { slug: "banking-abroad", label: "Banking Abroad", description: "Opening and using bank accounts in other countries." },
      { slug: "travel-cards", label: "Travel Cards", description: "Debit, credit and multi-currency cards for travellers." },
      { slug: "currency-exchange", label: "Currency Exchange", description: "Exchange rates, spreads and where to swap cash." },
      { slug: "atms", label: "ATMs", description: "Withdrawing cash abroad without paying twice." },
      { slug: "international-transfers", label: "International Transfers", description: "Sending and receiving money across borders." },
      { slug: "digital-wallets", label: "Digital Wallets", description: "Phone wallets and app payments on the road." },
      { slug: "travel-spending", label: "Travel Spending", description: "Paying smart day to day while travelling." },
      { slug: "rule-changes", label: "Rule Changes", description: "New limits, fees and money rules for travellers." },
    ],
  },
  "travel-tech": {
    key: "travel-tech",
    label: "Travel Tech",
    path: "/travel-tech",
    kicker: "Travel Tech",
    title: "The travel tech that earns its place in your bag",
    description:
      "eSIMs, apps, VPNs, adapters and gadgets: tested thinking on what keeps you connected, charged and oriented abroad.",
    accent: "bg-sky",
    topics: [
      { slug: "esims", label: "eSIMs", description: "Digital SIMs and travel data plans." },
      { slug: "travel-apps", label: "Travel Apps", description: "Apps worth the storage space." },
      { slug: "vpns", label: "VPNs", description: "Privacy and access on public networks." },
      { slug: "airport-wifi", label: "Airport Wi-Fi", description: "Getting online between gates safely." },
      { slug: "roaming", label: "Roaming", description: "What your home network charges abroad." },
      { slug: "translation-apps", label: "Translation Apps", description: "Getting understood without a phrasebook." },
      { slug: "maps", label: "Maps", description: "Offline maps and navigation." },
      { slug: "travel-gadgets", label: "Travel Gadgets", description: "Gear that solves real travel problems." },
      { slug: "power-adapters", label: "Power Adapters", description: "Plugs, voltage and charging abroad." },
      { slug: "digital-wallets", label: "Digital Wallets", description: "Tap-to-pay and wallet apps." },
      { slug: "rule-changes", label: "Rule Changes", description: "New tech rules, pricing and policy changes for travellers." },
    ],
  },
  guides: {
    key: "guides",
    label: "Jetlag Guides",
    path: "/guides",
    kicker: "Jetlag Guides",
    title: "Field notes for smarter trips",
    description:
      "Planning, flights, airports, packing and the hard-won lessons that turn a stressful trip into a smooth one.",
    accent: "bg-palm",
    topics: [
      { slug: "travel-planning", label: "Travel Planning", description: "Plan trips that survive contact with reality." },
      { slug: "flights", label: "Flights", description: "Booking, routing and surviving flights." },
      { slug: "airports", label: "Airports", description: "Transits, lounges and airport logistics." },
      { slug: "hotels", label: "Hotels", description: "Choosing and booking accommodation." },
      { slug: "packing", label: "Packing", description: "What to bring and what to leave." },
      { slug: "long-haul", label: "Long-haul Flights", description: "Staying sane on 12+ hour journeys." },
      { slug: "jet-lag", label: "Jet Lag", description: "Resetting your body clock." },
      { slug: "solo-travel", label: "Solo Travel", description: "Travelling alone with confidence." },
      { slug: "business-travel", label: "Business Travel", description: "Working trips done efficiently." },
      { slug: "travel-mistakes", label: "Travel Mistakes", description: "Expensive errors, so you don't make them." },
      { slug: "travel-hacks", label: "Travel Hacks", description: "Small moves, big payoffs." },
      { slug: "rule-changes", label: "Rule Changes", description: "New border, airport and airline rules." },
    ],
  },
  visas: {
    key: "visas",
    label: "Visas & Passports",
    path: "/visas",
    kicker: "Visas & Passports",
    title: "Know what your passport can do before the border tells you",
    description:
      "Entry requirements, visa types and application logistics, organised by the passport you actually hold. Always verified against official sources before you travel.",
    accent: "bg-amber",
    topics: [
      { slug: "visa-basics", label: "Visa Basics", description: "Visa types and how entry rules work." },
      { slug: "applications", label: "Applications", description: "Documents, appointments and processing." },
      { slug: "passports", label: "Passports", description: "Passport validity, renewals and strength." },
    ],
  },
};

export const sectionList = Object.values(sections);

export function getTopic(section: SectionKey, topic: string) {
  return sections[section].topics.find((t) => t.slug === topic);
}
