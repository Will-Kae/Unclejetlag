/**
 * Partner registry: the single place to manage commercial relationships.
 *
 * Every outbound partner link on the site goes through /go/[slug], which reads this file.
 * To change an affiliate URL, swap a partner, confirm a coupon or switch a partner off,
 * edit the entry here. No page edits needed.
 *
 * Rules (see /affiliate-disclosure and the editorial policy):
 * - Never display a discount code until the partner has confirmed it (discount.confirmed).
 * - Partners never decide rankings. Recommendations come from traveller criteria.
 * - Inactive partners redirect to the affiliate disclosure page instead of the partner.
 */
export type PartnerCategory =
  | "esim"
  | "vpn"
  | "password-manager"
  | "insurance"
  | "hotels"
  | "flights"
  | "travel-cards"
  | "money-transfer"
  | "banking"
  | "products"
  | "car-rental";

export type PartnerDiscount = {
  /** Code shown to readers. null = not yet issued or not confirmed: show nothing. */
  code: string | null;
  /** Short benefit label, e.g. "5% off". */
  amount: string;
  /** What the discount applies to, in plain words. */
  appliesTo: string;
  /** Only confirmed discounts are ever shown publicly. */
  confirmed: boolean;
};

export type Partner = {
  slug: string;
  name: string;
  category: PartnerCategory;
  /** Network / programme affiliate ID, for reference and reporting. */
  affiliateId?: string;
  network?: "impact" | "hasoffers" | "direct";
  /** Default tracked URL. */
  url: string;
  active: boolean;
  /** Shown in "featured" slots (homepage, tools hub). Never affects ranking order in comparisons. */
  featured?: boolean;
  /** Optional deep links (e.g. per destination), used via /go/[slug]?d=key. Falls back to url. */
  links?: Record<string, string>;
  /**
   * Query parameters the network uses for sub-IDs. /go appends placement, destination and campaign
   * to these so we can see which pages and slots convert, without collecting personal data.
   */
  subIdParams?: [string, string?, string?];
  discount?: PartnerDiscount;
  /** Extra partnership offers, shown only where relevant. */
  extraOffers?: { label: string; detail: string; confirmed: boolean }[];
  logo?: string;
  tagline: string;
  cta: string;
  /** Default campaign tag appended as a sub-ID when no campaign is given. */
  campaign?: string;
  /** Shown in the eSIM comparison's "Reader discount" row when there is no code to display (e.g. applied automatically). */
  discountNote?: string;
  /** Partner-programme rules we must respect (kept here so nobody forgets). */
  complianceNotes?: string[];
};

/**
 * Saily coupon: confirmed by Saily (October 2026). UNCLEJETLAG gives readers 10% off, and the
 * tracking link below carries ?coupon=unclejetlag so it applies automatically at checkout.
 */

export const partners: Partner[] = [
  {
    slug: "discovercars",
    name: "DiscoverCars",
    category: "car-rental",
    affiliateId: "unclejetlag",
    network: "direct",
    // Official affiliate URL from DiscoverCars. No sub-ID params, so the URL is used exactly as issued.
    url: "https://www.discovercars.com/uk/?a_aid=unclejetlag&chan=code1&currency=usd",
    active: true,
    tagline: "Search and compare car rentals from local and global suppliers.",
    cta: "Compare car hire prices",
  },
  {
    slug: "holafly",
    name: "Holafly",
    category: "esim",
    affiliateId: "7864825",
    network: "impact",
    // Impact tracking link. Add per-destination Impact deep links to `links` (keys match src/data/esim.ts slugs).
    url: "https://holafly.sjv.io/c/7864825/3856277/24764",
    active: true,
    featured: true,
    links: {},
    subIdParams: ["subId1", "subId2", "subId3"],
    discount: { code: "UNCLEJETLAG", amount: "5% off", appliesTo: "Holafly travel eSIMs. The code can be reused on future trips.", confirmed: true },
    extraOffers: [{ label: "Holafly Plans", detail: "10% off the first 12 months of a Holafly Plans subscription, where the partnership terms apply.", confirmed: true }],
    tagline: "Unlimited-data travel eSIMs for 160+ destinations.",
    cta: "View current plans",
    campaign: "uj",
  },
  {
    slug: "saily",
    name: "Saily",
    category: "esim",
    affiliateId: "17086",
    network: "hasoffers",
    url: "https://go.saily.site/aff_c?offer_id=101&aff_id=17086&coupon=unclejetlag",
    active: true,
    featured: true,
    links: {},
    subIdParams: ["aff_sub", "aff_sub2", "aff_sub3"],
    discount: { code: "UNCLEJETLAG", amount: "10% off", appliesTo: "Saily eSIM plans. Applied automatically when you use our links.", confirmed: true },
    tagline: "Fixed-data and unlimited eSIM plans, managed in one app.",
    cta: "View current plans",
    campaign: "uj",
    complianceNotes: ["No PPC bidding on Saily brand terms or misspellings."],
  },
  {
    slug: "nordvpn",
    name: "NordVPN",
    category: "vpn",
    affiliateId: "157733",
    network: "hasoffers",
    url: "https://go.nordvpn.net/aff_c?offer_id=15&aff_id=157733&url_id=902",
    active: true,
    featured: true,
    subIdParams: ["aff_sub", "aff_sub2", "aff_sub3"],
    tagline: "Encrypts your connection on networks you don't control.",
    cta: "Protect your connection",
    campaign: "uj",
    complianceNotes: ["No PPC bidding on NordVPN, NordPass, Nord or variants/misspellings."],
  },
  {
    slug: "nordpass",
    name: "NordPass",
    category: "password-manager",
    affiliateId: "157733",
    network: "hasoffers",
    url: "https://go.nordpass.io/aff_c?offer_id=488&aff_id=157733&url_id=9356",
    active: true,
    featured: true,
    subIdParams: ["aff_sub", "aff_sub2", "aff_sub3"],
    tagline: "A password manager for the logins you can't afford to lose abroad.",
    cta: "Secure your passwords",
    campaign: "uj",
    complianceNotes: ["No PPC bidding on NordVPN, NordPass, Nord or variants/misspellings."],
  },
  {
    // Referral link issued by Dukascopy (October 2026). ref=4YU-J8E credits sign-ups to Uncle Jetlag.
    // No sub-ID params: the URL is passed through /go/dukascopy unchanged.
    slug: "dukascopy",
    name: "Dukascopy Bank",
    category: "banking",
    affiliateId: "4YU-J8E",
    network: "direct",
    url: "https://www.dukascopy.bank/swiss/open-mca-account/?ref=4YU-J8E&lang=en",
    active: true,
    tagline: "Swiss multi-currency account opened by video call.",
    cta: "Open an account",
  },
  // Demo entries kept so older MDX that references them keeps building. Inactive = no outbound link.
  { slug: "demo-esim-a", name: "eSIM Provider A (demo)", category: "esim", url: "https://example.com/", active: false, tagline: "", cta: "" },
  { slug: "demo-esim-b", name: "eSIM Provider B (demo)", category: "esim", url: "https://example.com/", active: false, tagline: "", cta: "" },
  { slug: "demo-esim-c", name: "eSIM Provider C (demo)", category: "esim", url: "https://example.com/", active: false, tagline: "", cta: "" },
  { slug: "demo-card-a", name: "Multi-currency Card A (demo)", category: "travel-cards", url: "https://example.com/", active: false, tagline: "", cta: "" },
  { slug: "demo-insurance-a", name: "Travel Insurer A (demo)", category: "insurance", url: "https://example.com/", active: false, tagline: "", cta: "" },
];

export function getPartner(slug: string) {
  return partners.find((p) => p.slug === slug);
}

export function partnersIn(category: PartnerCategory) {
  return partners.filter((p) => p.active && p.category === category);
}

/** The discount to show publicly, or null. Unconfirmed codes are never returned. */
export function publicDiscount(p: Partner | undefined) {
  return p?.discount?.confirmed && p.discount.code ? p.discount : null;
}

export type GoParams = { d?: string; placement?: string; campaign?: string };

/** Internal tracked link: /go/[slug]?d=&p=&c= */
export function goHref(slug: string, { d, placement, campaign }: GoParams = {}) {
  const q = new URLSearchParams();
  if (d) q.set("d", d);
  if (placement) q.set("p", placement);
  if (campaign) q.set("c", campaign);
  const s = q.toString();
  return `/go/${slug}${s ? `?${s}` : ""}`;
}
