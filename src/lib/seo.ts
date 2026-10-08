import type { Metadata } from "next";
import { site, SITE_URL } from "@/data/site";
import type { Author } from "@/data/authors";
import type { Faq } from "@/lib/content/schema";

export type Crumb = { name: string; href: string };

type MetaInput = {
  title: string;
  description: string;
  path: string;
  /** Used for the generated OG image */
  ogKicker?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
  noindex?: boolean;
  /** Set true when title already contains the brand */
  absoluteTitle?: boolean;
};

export function ogImageUrl(title: string, kicker?: string) {
  const p = new URLSearchParams({ title });
  if (kicker) p.set("kicker", kicker);
  return `/og?${p.toString()}`;
}

export function buildMetadata(m: MetaInput): Metadata {
  const image = m.image ?? ogImageUrl(m.title, m.ogKicker);
  const fullTitle = m.absoluteTitle ? m.title : `${m.title} | ${site.name}`;
  return {
    title: m.absoluteTitle ? { absolute: m.title } : m.title,
    description: m.description,
    alternates: { canonical: m.path },
    robots: m.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: m.type ?? "website",
      url: m.path,
      siteName: site.name,
      title: fullTitle,
      description: m.description,
      locale: "en_GB",
      images: [{ url: image, width: 1200, height: 630, alt: m.title }],
      ...(m.type === "article"
        ? {
            publishedTime: m.publishedTime,
            modifiedTime: m.modifiedTime,
            authors: m.authors,
            tags: m.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: site.twitterHandle,
      title: fullTitle,
      description: m.description,
      images: [image],
    },
  };
}

/* ------------------------------ JSON-LD builders ------------------------------ */

const abs = (p: string) => (p.startsWith("http") ? p : `${SITE_URL}${p}`);

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: site.name,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: abs("/brand/avatar-192.png"), width: 192, height: 192 },
  slogan: site.tagline,
  founder: { "@type": "Person", "@id": `${SITE_URL}/authors/uncle-jetlag#person`, name: site.founder.name, alternateName: site.founder.penName },
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.countryCode,
  },
  sameAs: Object.values(site.social),
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: site.name,
  url: SITE_URL,
  description: site.description,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbLd = (crumbs: Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: abs(c.href),
  })),
});

export const personLd = (a: Author) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/authors/${a.slug}#person`,
  name: a.legalName ?? a.name,
  ...(a.legalName ? { alternateName: a.name, givenName: a.legalName.split(" ")[0], familyName: a.legalName.split(" ").at(-1) } : {}),
  url: abs(`/authors/${a.slug}`),
  jobTitle: a.role,
  image: abs("/brand/avatar-192.png"),
  description: a.shortBio,
  worksFor: { "@id": `${SITE_URL}/#organization` },
  knowsAbout: a.expertise,
  ...(a.sameAs.length ? { sameAs: a.sameAs } : {}),
});

export const articleLd = (a: {
  title: string;
  description: string;
  url: string;
  publishedDate: string;
  updatedDate: string;
  author: Author;
  image?: string;
  section?: string;
  tags?: string[];
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: a.title,
  description: a.description,
  mainEntityOfPage: { "@type": "WebPage", "@id": abs(a.url) },
  url: abs(a.url),
  datePublished: a.publishedDate,
  dateModified: a.updatedDate,
  image: [abs(a.image ?? ogImageUrl(a.title, a.section))],
  author: {
    "@type": "Person",
    "@id": `${SITE_URL}/authors/${a.author.slug}#person`,
    name: a.author.legalName ?? a.author.name,
    ...(a.author.legalName ? { alternateName: a.author.name } : {}),
    url: abs(`/authors/${a.author.slug}`),
  },
  publisher: { "@id": `${SITE_URL}/#organization` },
  articleSection: a.section,
  keywords: a.tags?.join(", "),
  inLanguage: "en",
});

export const faqLd = (faqs: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const collectionLd = (name: string, description: string, url: string, items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  description,
  url: abs(url),
  isPartOf: { "@id": `${SITE_URL}/#website` },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: abs(it.url), name: it.name })),
  },
});
