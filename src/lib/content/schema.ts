import { z } from "zod";

/** YAML turns unquoted dates into Date objects — normalise to YYYY-MM-DD. */
const dateStr = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must be YYYY-MM-DD"),
);

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slugs must be kebab-case");

export const imageSchema = z.object({
  src: z.string().optional(),
  alt: z.string(),
  credit: z.string().optional(),
});

export const faqSchema = z.object({ q: z.string(), a: z.string() });
export const sourceSchema = z.object({
  title: z.string(),
  url: z.url(),
  publisher: z.string().optional(),
});

const base = {
  title: z.string().min(5),
  slug,
  description: z.string().min(40).max(320),
  author: z.string().default("uncle-jetlag"),
  publishedDate: dateStr,
  updatedDate: dateStr,
  featuredImage: imageSchema.optional(),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  faqs: z.array(faqSchema).default([]),
  sources: z.array(sourceSchema).default([]),
  status: z.enum(["published", "draft"]).default("published"),
  /**
   * verified — a human editor has checked it against sources → indexable + in sitemap.
   * review   — written, no placeholder facts, awaiting editor sign-off → noindex.
   * demo     — contains placeholder facts; shows a visible banner → noindex.
   */
  contentStatus: z.enum(["verified", "review", "demo"]).default("demo"),
  hasAffiliateLinks: z.boolean().default(false),
};

export const articleSchema = z.object({
  ...base,
  category: z.enum(["money", "travel-tech", "guides", "visas"]),
  subcategory: z.string(),
  featured: z.boolean().default(false),
  trending: z.boolean().default(false),
  /** Optional country slugs this article is about — powers destination cross-links. */
  countries: z.array(z.string()).default([]),
  /** guide = evergreen article; update = dated news about a rule, fee or requirement change. */
  kind: z.enum(["guide", "update"]).default("guide"),
  /** For updates: the date the change takes (or took) effect. */
  effectiveDate: dateStr.optional(),
}).refine((a) => a.kind !== "update" || a.sources.length >= 2, { message: "Updates need at least 2 sources" });

export const destinationSchema = z.object({
  ...base,
  country: z.string(),
  region: z.enum([
    "africa",
    "europe",
    "asia",
    "middle-east",
    "north-america",
    "south-america",
    "caribbean",
    "oceania",
  ]),
  capital: z.string(),
  currency: z.object({ code: z.string().length(3), name: z.string(), symbol: z.string().optional() }),
  languages: z.array(z.string()),
  timezone: z.string(),
  plugTypes: z.array(z.string()),
  voltage: z.string(),
  drivingSide: z.enum(["left", "right"]),
  emergency: z.array(z.object({ label: z.string(), number: z.string() })),
  airports: z.array(z.object({ code: z.string().length(3), name: z.string(), city: z.string() })),
  bestTime: z.string(),
  dailyBudget: z
    .object({
      currency: z.string(),
      budget: z.string(),
      midRange: z.string(),
      comfort: z.string(),
      isPlaceholder: z.boolean().default(true),
    })
    .optional(),
});

export const visaBriefSchema = z.object({
  ...base,
  passport: z.string(),
  destination: z.string(),
  requirement: z.string(),
  visaType: z.string(),
  allowedStay: z.string(),
  applicationMethod: z.string(),
  fees: z.string(),
  processingTime: z.string(),
  documents: z.array(z.string()).default([]),
  officialResources: z.array(sourceSchema).min(1, "Every visa brief must link to at least one official source"),
  /** Date a human last checked the requirement against official sources. */
  verifiedDate: dateStr.optional(),
});

export const pageSchema = z.object({
  title: z.string(),
  slug,
  description: z.string(),
  updatedDate: dateStr,
  isTemplate: z.boolean().default(false),
});

export type ArticleFrontmatter = z.infer<typeof articleSchema>;
export type DestinationFrontmatter = z.infer<typeof destinationSchema>;
export type VisaBriefFrontmatter = z.infer<typeof visaBriefSchema>;
export type PageFrontmatter = z.infer<typeof pageSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type Source = z.infer<typeof sourceSchema>;
