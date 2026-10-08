/**
 * Travel Tools registry. Add a tool here and it appears on /tools, in search and in the footer.
 * status "soon" = shown as a roadmap item with no link (never a fake, empty page).
 */
export type ToolCategory = "plan" | "connectivity" | "money" | "security" | "booking";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  status: "live" | "soon";
  href?: string;
  /** Partner slug when the tool's main action is a partner. */
  partner?: string;
  /** "related" = owned by the founder (QeFX). */
  relationship?: "affiliate" | "related";
};

export const toolCategories: { key: ToolCategory; label: string; intro: string }[] = [
  { key: "plan", label: "Plan & prepare", intro: "Entry rules, checklists and the admin that ruins trips when it's left late." },
  { key: "connectivity", label: "Connectivity", intro: "Land with data, not a roaming bill." },
  { key: "money", label: "Money", intro: "Rates, cards and costs, before you pay them." },
  { key: "security", label: "Online security", intro: "Protect the phone that holds your whole trip." },
  { key: "booking", label: "Book & go", intro: "Coming as we find partners worth recommending." },
];

export const tools: Tool[] = [
  { slug: "before-you-fly", name: "Before You Fly", description: "A preparation checklist for your destination, passport and trip length, linked to official sources.", category: "plan", status: "live", href: "/tools/before-you-fly" },
  { slug: "visa-finder", name: "Visa finder", description: "Entry briefs by the passport you hold, each linked to the official source.", category: "plan", status: "live", href: "/visas#finder" },
  { slug: "where-can-i-go", name: "Where can I go?", description: "Destinations your passport can reach without a visa.", category: "plan", status: "soon" },
  { slug: "passport-index", name: "Passport index", description: "How your passport compares on travel freedom.", category: "plan", status: "soon" },
  { slug: "packing-list", name: "Packing list generator", description: "A packing list built from your destination and season.", category: "plan", status: "soon" },
  { slug: "jetlag-calculator", name: "Jetlag calculator", description: "A sleep and light plan for crossing time zones.", category: "plan", status: "soon" },

  { slug: "esim-finder", name: "eSIM Finder", description: "How much data you need and which plan types fit your trip.", category: "connectivity", status: "live", href: "/esim" },
  { slug: "holafly", name: "Holafly", description: "Unlimited-data travel eSIMs. Readers save 5% with code UNCLEJETLAG.", category: "connectivity", status: "live", partner: "holafly", relationship: "affiliate" },
  { slug: "saily", name: "Saily", description: "Fixed-data and unlimited eSIM plans with in-app top-ups.", category: "connectivity", status: "live", partner: "saily", relationship: "affiliate" },

  { slug: "currency-converter", name: "QeFX currency converter", description: "Mid-market reference rates, with a travel mode for home and destination currencies.", category: "money", status: "live", href: "https://converter.qefxmoney.com", relationship: "related" },
  { slug: "cost-calculator", name: "Cost-of-travel calculator", description: "What a day costs at budget, mid-range and comfortable levels.", category: "money", status: "soon" },
  { slug: "travel-cards", name: "Travel card comparison", description: "Cards and accounts compared on fees that actually hit travellers.", category: "money", status: "soon" },

  { slug: "travel-security", name: "Travel Security guide", description: "Public Wi-Fi, passwords, lost phones and scams, explained without the fear.", category: "security", status: "live", href: "/security" },
  { slug: "nordvpn", name: "NordVPN", description: "Encrypts your connection on hotel, airport and café Wi-Fi.", category: "security", status: "live", partner: "nordvpn", relationship: "affiliate" },
  { slug: "nordpass", name: "NordPass", description: "A password manager for the logins you can't afford to lose abroad.", category: "security", status: "live", partner: "nordpass", relationship: "affiliate" },

  { slug: "insurance", name: "Travel insurance comparison", description: "", category: "booking", status: "soon" },
  { slug: "flights", name: "Flight search", description: "", category: "booking", status: "soon" },
  { slug: "hotels", name: "Hotel search", description: "", category: "booking", status: "soon" },
  { slug: "lounges", name: "Airport lounge finder", description: "", category: "booking", status: "soon" },
  { slug: "transfers", name: "Airport transfers", description: "", category: "booking", status: "soon" },
  { slug: "car-rental", name: "Car rental search", description: "Compare rental cars from local and global suppliers with DiscoverCars.", category: "booking", status: "live", href: "/guides#car-rentals", relationship: "affiliate" },
  { slug: "activities", name: "Activities", description: "", category: "booking", status: "soon" },
  { slug: "gear", name: "Luggage & travel gear", description: "", category: "booking", status: "soon" },
];
