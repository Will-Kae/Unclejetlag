export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://unclejetlag.com").replace(/\/$/, "");

export const site = {
  name: "Uncle Jetlag",
  shortName: "Uncle Jetlag",
  domain: "unclejetlag.com",
  url: SITE_URL,
  tagline: "Travel smarter. Go further. Stay connected.",
  motto: "Jetlagged, but informed.",
  description:
    "Travel intelligence, destination guides and tools for people who actually go places: visas, money, eSIMs, travel security and country guides, without the fluff.",
  founder: { name: "Willard Munyaradzi Kachere", penName: "Uncle Jetlag", url: "/authors/uncle-jetlag" },
  locale: "en",
  address: {
    street: "3 Alice Lane",
    locality: "Sandton",
    region: "Johannesburg",
    postalCode: "2196",
    country: "South Africa",
    countryCode: "ZA",
  },
  socialHandle: "@unclejetlag",
  twitterHandle: "@unclejetlag",
  email: {
    general: "info@unclejetlag.com",
    enquiries: "runway@unclejetlag.com",
    legal: "legal@unclejetlag.com",
    partnerships: "partnerships@unclejetlag.com",
    newsletter: "jetlagged@unclejetlag.com",
  },
  // Official profiles — every platform uses the handle @unclejetlag (the WhatsApp Channel has its own link).
  social: {
    youtube: "https://www.youtube.com/@unclejetlag",
    instagram: "https://www.instagram.com/unclejetlag",
    tiktok: "https://www.tiktok.com/@unclejetlag",
    x: "https://x.com/unclejetlag",
    facebook: "https://www.facebook.com/UncleJetlag",
    linkedin: "https://www.linkedin.com/company/unclejetlag",
    whatsapp: "https://whatsapp.com/channel/0029VbDkV6G7IUYWstHfyA2s",
  },
} as const;

export type NavItem = { label: string; href: string; description?: string };

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Destinations", href: "/destinations" },
  { label: "Visas & Passports", href: "/visas" },
  { label: "Money Abroad", href: "/money" },
  { label: "Travel Tech", href: "/travel-tech" },
  { label: "Jetlag Guides", href: "/guides" },
  { label: "eSIM", href: "/esim" },
  { label: "Updates", href: "/updates" },
  { label: "About", href: "/about" },
];

export const footerNav = {
  Explore: [
    { label: "Latest updates", href: "/updates" },
    { label: "Visas & passports", href: "/visas" },
    { label: "Money Abroad", href: "/money" },
    { label: "Travel Tech", href: "/travel-tech" },
    { label: "Jetlag Guides", href: "/guides" },
    { label: "Search", href: "/search" },
  ],
  Destinations: [
    { label: "All destinations", href: "/destinations" },
    { label: "Georgia", href: "/destinations/georgia" },
    { label: "South Africa", href: "/destinations/south-africa" },
    { label: "United Arab Emirates", href: "/destinations/united-arab-emirates" },
    { label: "United Kingdom", href: "/destinations/united-kingdom" },
    { label: "Canada", href: "/destinations/canada" },
  ],
  "Travel Tools": [
    { label: "All travel tools", href: "/tools" },
    { label: "Before You Fly checklist", href: "/tools/before-you-fly" },
    { label: "eSIM Finder", href: "/esim" },
    { label: "Visa finder", href: "/visas#finder" },
    { label: "Currency converter (QeFX)", href: "https://converter.qefxmoney.com" },
    { label: "Uncle Jetlag Recommends", href: "/recommends" },
  ],
  "Connect & protect": [
    { label: "Travel eSIM (save with UNCLEJETLAG)", href: "/esim" },
    { label: "eSIM for South Africa", href: "/esim/south-africa" },
    { label: "eSIM for Georgia", href: "/esim/georgia" },
    { label: "Travel Security", href: "/security" },
    { label: "Public Wi-Fi & VPNs", href: "/security#vpn" },
  ],
  "About Uncle Jetlag": [
    { label: "About", href: "/about" },
    { label: "Willard Munyaradzi Kachere", href: "/authors/uncle-jetlag" },
    { label: "Work with us", href: "/contact" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Editorial policy", href: "/editorial-policy" },
    { label: "Corrections policy", href: "/corrections-policy" },
    { label: "Photo credits", href: "/photo-credits" },
  ],
  Legal: [
    { label: "Affiliate disclosure", href: "/affiliate-disclosure" },
    { label: "Privacy", href: "/privacy" },
    { label: "Cookies", href: "/cookies" },
    { label: "Terms", href: "/terms" },
  ],
} satisfies Record<string, NavItem[]>;
