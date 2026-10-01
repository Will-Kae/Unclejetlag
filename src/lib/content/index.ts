/**
 * Content source. Every page reads content through this module.
 * To migrate to a headless CMS, re-implement these functions against the CMS API
 * and keep the return types — no page or component needs to change.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import type { ZodType } from "zod";
import {
  articleSchema,
  destinationSchema,
  pageSchema,
  visaBriefSchema,
  type ArticleFrontmatter,
  type DestinationFrontmatter,
  type PageFrontmatter,
  type VisaBriefFrontmatter,
} from "./schema";
import { readingTime } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { getCountry } from "@/data/countries";
import { sections, getTopic } from "@/data/taxonomy";
import { authors } from "@/data/authors";
import { featuredFor } from "@/lib/photos";

const CONTENT_DIR = path.join(process.cwd(), "content");
const isProd = process.env.NODE_ENV === "production";

export type Heading = { id: string; text: string; depth: 2 | 3 };

type WithBody = { body: string; headings: Heading[]; readingTime: number; url: string };

export type Article = ArticleFrontmatter & WithBody;
export type Destination = DestinationFrontmatter & WithBody & { countryName: string; iso2: string };
export type VisaBrief = VisaBriefFrontmatter & WithBody & { passportName: string; destinationName: string; passportDemonym: string };
export type Page = PageFrontmatter & { body: string; url: string };

/** Summary shape for cards and listings (no body — keeps RSC payloads small). */
export type ArticleSummary = Omit<Article, "body" | "headings" | "faqs" | "sources">;

function stripInline(md: string) {
  return md
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/** Extract H2/H3 headings with the same ids rehype-slug will generate. */
export function extractHeadings(body: string): Heading[] {
  const slugger = new GithubSlugger();
  const out: Heading[] = [];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = stripInline(m[2]);
    out.push({ id: slugger.slug(text), text, depth: m[1].length as 2 | 3 });
  }
  return out;
}

function readDir<T>(dir: string, schema: ZodType<T>): { data: T; body: string; file: string }[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => /\.mdx?$/.test(f))
    .map((file) => {
      const raw = fs.readFileSync(path.join(full, file), "utf8");
      const { data, content } = matter(raw);
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
        throw new Error(`Invalid frontmatter in content/${dir}/${file}\n${issues}`);
      }
      return { data: parsed.data, body: content, file };
    });
}

const cache = new Map<string, unknown>();
function memo<T>(key: string, fn: () => T): T {
  // In dev, re-read on every request so content edits show up instantly.
  if (!isProd) return fn();
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as T;
}

const visible = (s: { status: string }) => s.status === "published" || !isProd;
const byUpdated = <T extends { updatedDate: string }>(a: T, b: T) => b.updatedDate.localeCompare(a.updatedDate);

/* ---------------------------------- Articles --------------------------------- */

export function getAllArticles(): Article[] {
  return memo("articles", () =>
    readDir("articles", articleSchema)
      .map(({ data, body, file }) => {
        if (`${data.slug}.mdx` !== file && `${data.slug}.md` !== file)
          throw new Error(`content/articles/${file}: slug "${data.slug}" must match filename`);
        if (data.category !== "visas" && !getTopic(data.category, data.subcategory))
          throw new Error(`content/articles/${file}: unknown subcategory "${data.subcategory}" for ${data.category}`);
        if (!authors[data.author]) throw new Error(`content/articles/${file}: unknown author "${data.author}"`);
        return {
          ...data,
          featuredImage: data.featuredImage ?? featuredFor(data.slug),
          body,
          headings: extractHeadings(body),
          readingTime: readingTime(body),
          url: routes.article(data.category, data.slug),
        } satisfies Article;
      })
      .filter(visible)
      .sort(byUpdated),
  );
}

export function toSummary(a: Article): ArticleSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, headings, faqs, sources, ...rest } = a;
  return rest;
}

export function getArticle(category: Article["category"], slug: string) {
  return getAllArticles().find((a) => a.category === category && a.slug === slug);
}

export function getArticlesBySection(category: Article["category"]) {
  return getAllArticles().filter((a) => a.category === category);
}

export function getArticlesByTopic(category: Article["category"], topic: string) {
  return getArticlesBySection(category).filter((a) => a.subcategory === topic);
}

export function getTrendingArticles(limit = 6) {
  const all = getAllArticles();
  const trending = all.filter((a) => a.trending);
  return [...trending, ...all.filter((a) => !a.trending)].slice(0, limit);
}

/** Dated news updates, newest first (by published date). */
export function getUpdates(limit?: number) {
  const u = getAllArticles().filter((a) => a.kind === "update").sort((a, b) => b.publishedDate.localeCompare(a.publishedDate)).map(toSummary);
  return typeof limit === "number" ? u.slice(0, limit) : u;
}

export function getFeaturedArticle() {
  return getAllArticles().find((a) => a.featured) ?? getAllArticles()[0];
}

export function getArticlesForCountry(country: string, limit = 6) {
  return getAllArticles()
    .filter((a) => a.countries.includes(country) || a.tags.map((t) => t.toLowerCase()).includes(country.replace(/-/g, " ")))
    .slice(0, limit);
}

/** Related = same subcategory > same category > shared tags; never itself. */
export function getRelatedArticles(article: Pick<Article, "slug" | "category" | "subcategory" | "tags">, limit = 3) {
  const tags = new Set(article.tags.map((t) => t.toLowerCase()));
  return getAllArticles()
    .filter((a) => a.slug !== article.slug)
    .map((a) => {
      let score = 0;
      if (a.subcategory === article.subcategory) score += 4;
      if (a.category === article.category) score += 2;
      score += a.tags.filter((t) => tags.has(t.toLowerCase())).length * 1.5;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a);
}

/* -------------------------------- Destinations ------------------------------- */

export function getAllDestinations(): Destination[] {
  return memo("destinations", () =>
    readDir("destinations", destinationSchema)
      .map(({ data, body, file }) => {
        const c = getCountry(data.country);
        if (!c) throw new Error(`content/destinations/${file}: unknown country "${data.country}" (add it to src/data/countries.ts)`);
        return {
          ...data,
          featuredImage: data.featuredImage ?? featuredFor(data.country),
          body,
          headings: extractHeadings(body),
          readingTime: readingTime(body),
          url: routes.destination(data.country),
          countryName: c.name,
          iso2: c.iso2,
        } satisfies Destination;
      })
      .filter(visible)
      .sort((a, b) => a.countryName.localeCompare(b.countryName)),
  );
}

export function getDestination(country: string) {
  return getAllDestinations().find((d) => d.country === country);
}

export function destinationSlugs() {
  return new Set(getAllDestinations().map((d) => d.country));
}

/* --------------------------------- Visa briefs ------------------------------- */

export function getAllVisaBriefs(): VisaBrief[] {
  return memo("visas", () =>
    readDir("visas", visaBriefSchema)
      .map(({ data, body, file }) => {
        const p = getCountry(data.passport);
        const d = getCountry(data.destination);
        if (!p || !d) throw new Error(`content/visas/${file}: unknown passport/destination`);
        if (file.replace(/\.mdx?$/, "") !== `${data.passport}--${data.destination}`)
          throw new Error(`content/visas/${file}: filename must be {passport}--{destination}.mdx`);
        return {
          ...data,
          featuredImage: data.featuredImage ?? featuredFor(data.destination),
          body,
          headings: extractHeadings(body),
          readingTime: readingTime(body),
          url: routes.visaBrief(data.passport, data.destination),
          passportName: p.name,
          passportDemonym: p.demonym ?? p.name,
          destinationName: d.name,
        } satisfies VisaBrief;
      })
      .filter(visible)
      .sort(byUpdated),
  );
}

export function getVisaBrief(passport: string, destination: string) {
  return getAllVisaBriefs().find((v) => v.passport === passport && v.destination === destination);
}

export function getVisaBriefsForPassport(passport: string) {
  return getAllVisaBriefs().filter((v) => v.passport === passport);
}

export function getVisaBriefsForDestination(destination: string) {
  return getAllVisaBriefs().filter((v) => v.destination === destination);
}

/** Present a visa brief as an article card (e.g. in "Trending"). */
export function visaBriefCard(v: VisaBrief): ArticleSummary {
  return {
    title: v.title,
    slug: v.slug,
    description: v.description,
    author: v.author,
    publishedDate: v.publishedDate,
    updatedDate: v.updatedDate,
    featuredImage: v.featuredImage,
    tags: v.tags,
    status: v.status,
    contentStatus: v.contentStatus,
    hasAffiliateLinks: false,
    category: "visas",
    subcategory: "passports",
    featured: false,
    trending: true,
    countries: [v.destination],
    kind: "guide",
    readingTime: v.readingTime,
    url: v.url,
  };
}

export function passportsWithBriefs() {
  return [...new Set(getAllVisaBriefs().map((v) => v.passport))];
}

/* ------------------------------------ Pages ---------------------------------- */

export function getAllPages(): Page[] {
  return memo("pages", () =>
    readDir("pages", pageSchema).map(({ data, body }) => ({ ...data, body, url: `/${data.slug}` })),
  );
}

export function getPage(slug: string) {
  return getAllPages().find((p) => p.slug === slug);
}

/* --------------------------------- Indexability ------------------------------ */

/** Only editor-verified content is indexed and listed in the sitemap. */
export function isIndexable(item: { contentStatus: string }) {
  return item.contentStatus === "verified" || process.env.INDEX_UNVERIFIED_CONTENT === "true";
}

export { sections };
