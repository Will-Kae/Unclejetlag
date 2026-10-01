export type FaqItem = { q: string; a: string; link?: { label: string; href: string } };
export type FaqGroup = { title: string; items: FaqItem[] };

export const faqGroups: FaqGroup[] = [
  {
    title: "About Uncle Jetlag",
    items: [
      {
        q: "What is Uncle Jetlag?",
        a: "Uncle Jetlag is a travel and lifestyle platform built for people who want to explore the world with more confidence. We share destination guides, practical travel tips, banking and payment information, recommendations and real-world travel experiences.",
        link: { label: "About Uncle Jetlag", href: "/about" },
      },
      {
        q: "Who is Uncle Jetlag for?",
        a: "Everyone from first-time international travellers to frequent flyers, business travellers, digital nomads and anyone planning their next adventure.",
      },
      {
        q: "Do you actually visit the destinations you talk about?",
        a: "Many of our guides are inspired by firsthand travel experiences. We also use research and official sources, and each guide lists the sources we checked and the date it was last updated.",
        link: { label: "How we research and verify", href: "/editorial-policy" },
      },
    ],
  },
  {
    title: "Visas & entry requirements",
    items: [
      {
        q: "Do I need a visa for the country I want to visit?",
        a: "That depends on your passport, destination, reason for travelling and length of stay. Our visa briefs and destination guides explain the general requirements, but always confirm current rules with the relevant embassy, consulate or immigration authority before travelling.",
        link: { label: "Visa finder", href: "/visas" },
      },
      {
        q: "Can Uncle Jetlag help me get a visa?",
        a: "We can help you understand the process, common requirements and where to find official information. However, Uncle Jetlag is not an immigration agency and cannot issue, approve or guarantee visas.",
        link: { label: "Visa types explained", href: "/visas/guides/visa-types-explained" },
      },
    ],
  },
  {
    title: "Money, banking & payments",
    items: [
      {
        q: "Can tourists open bank accounts abroad?",
        a: "In some countries, yes. Certain banks and financial platforms allow non-residents or visitors to open accounts, while others require residency or a local address. Our guides explore available options and typical requirements where applicable.",
        link: { label: "Example: opening a bank account in Canada", href: "/money/can-tourists-open-bank-account-canada" },
      },
      {
        q: "What's the best way to pay when travelling abroad?",
        a: "It depends on where you're going. Cards, mobile wallets, cash and other payment methods vary significantly between countries. Our guides help you understand what works before you arrive.",
        link: { label: "The best ways to pay while travelling", href: "/money/best-ways-to-pay-while-traveling" },
      },
      {
        q: "How do I check exchange rates while I travel?",
        a: "Use QeFX, our official currency converter. Travel Mode lets you set your home and destination currencies once and convert prices as you go. It shows mid-market reference rates, so expect airport kiosks, hotels and card payments to cost a little more. QeFX is owned by Uncle Jetlag's founder.",
        link: { label: "Open the QeFX converter", href: "https://converter.qefxmoney.com" },
      },
      {
        q: "Should I travel with cash or rely on my card?",
        a: "Having more than one payment option is usually a good idea. Consider travelling with suitable cards, some local or convertible currency where appropriate, and access to backup funds in case your main payment method doesn't work.",
        link: { label: "Airport currency exchange, explained", href: "/money/airport-currency-exchange" },
      },
      {
        q: "Does Uncle Jetlag recommend banks or financial services?",
        a: "We may feature or compare banks, fintech platforms and payment services that could be useful to travellers. Eligibility, fees and availability can change, so always confirm the latest terms directly with the provider. We explain how we make money in our Affiliate Disclosure.",
        link: { label: "Our first banking partner: Dukascopy Bank review", href: "/money/dukascopy-multi-currency-account-review" },
      },
    ],
  },
  {
    title: "Planning your trip",
    items: [
      {
        q: "How much money should I budget for my trip?",
        a: "It depends on the destination, length of stay and how you like to travel. Accommodation, food, transport and activities vary dramatically from one destination to another. Our guides give budget, mid-range and comfort estimates so you know what to expect.",
        link: { label: "Example: two weeks in Georgia", href: "/guides/two-weeks-in-georgia-cost" },
      },
      {
        q: "Where should I stay when visiting a new city?",
        a: "Our destination guides help you weigh up where to stay based on convenience, attractions, transport and the kind of experience you're looking for.",
        link: { label: "Destination guides", href: "/destinations" },
      },
      {
        q: "How do I find things to do at my destination?",
        a: "Check our destination guides for highlights, activities, day trips and some of the less obvious experiences worth discovering.",
        link: { label: "Destination guides", href: "/destinations" },
      },
      {
        q: "Does Uncle Jetlag cover business travel?",
        a: "Absolutely. Uncle Jetlag isn't only about holidays. We also cover useful information for business travellers and people who frequently travel internationally, from visitor visas for meetings to managing jet lag.",
        link: { label: "How to beat jet lag", href: "/guides/how-to-beat-jet-lag" },
      },
    ],
  },
  {
    title: "Safety, insurance & connectivity",
    items: [
      {
        q: "Is the information on Uncle Jetlag always up to date?",
        a: "We do our best to keep our content current, but travel rules, visa requirements, banking policies, prices and regulations can change quickly. Always verify important information with the relevant official authority or provider before making travel decisions.",
        link: { label: "Corrections Policy", href: "/corrections-policy" },
      },
      {
        q: "Do I need travel insurance?",
        a: "Travel insurance is worth considering whenever you travel internationally, and some countries require it (Georgia, for example, has required medical cover for all visitors since 1 January 2026). Depending on your policy, it may cover medical emergencies, cancellations, lost luggage, delays and other unexpected situations.",
      },
      {
        q: "How do I stay connected while travelling?",
        a: "Depending on your destination, you may be able to use a local SIM card, an eSIM, international roaming or portable Wi-Fi. Our guides highlight practical connectivity options to help you stay online.",
        link: { label: "Best eSIM options for travellers", href: "/travel-tech/best-esim-options-international-travelers" },
      },
    ],
  },
  {
    title: "Community & partnerships",
    items: [
      {
        q: "Can I suggest a destination for Uncle Jetlag to cover?",
        a: "Definitely. If there's a country, city, airline, bank, travel service or travel question you'd like Uncle Jetlag to explore, we'd love to hear your suggestion. Email runway@unclejetlag.com.",
        link: { label: "Contact", href: "/contact" },
      },
      {
        q: "Can brands work with Uncle Jetlag?",
        a: "Yes. We're open to relevant brand partnerships, destination collaborations, travel campaigns, sponsorships and other opportunities that make sense for our audience. Partners never influence our editorial. Email partnerships@unclejetlag.com.",
        link: { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
      },
      {
        q: "How can I contact Uncle Jetlag?",
        a: "Head over to our Contact page. Whether you've got a question, suggestion, correction, partnership opportunity or simply want to say hello, we'd love to hear from you.",
        link: { label: "Contact", href: "/contact" },
      },
    ],
  },
  {
    title: "And the question we had to answer…",
    items: [
      {
        q: "Why the name Uncle Jetlag?",
        a: "Because when you're always somewhere between home, an airport and your next destination, jet lag becomes part of the lifestyle. Jetlagged, but one thing's for sure: WWW stands for World Wide Will. 🌍✈️",
        link: { label: "Meet Uncle Jetlag", href: "/authors/uncle-jetlag" },
      },
    ],
  },
];
