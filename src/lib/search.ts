/**
 * Client-safe search engine over the static index at /search-index.json.
 * The SearchDoc contract is deliberately simple so it can later be replaced by
 * Algolia / Typesense / Meilisearch without touching the UI.
 */
export type SearchDocType = "article" | "destination" | "visa" | "country" | "topic" | "tool" | "esim";

export type SearchDoc = {
  id: string;
  type: SearchDocType;
  title: string;
  description: string;
  url: string;
  label: string; // e.g. "Money Abroad", "Destination", "Visa brief"
  keywords: string; // lowercased haystack of tags, aliases etc.
  date?: string;
};

const STOP = new Set(["the", "a", "an", "to", "in", "for", "of", "and", "or", "is", "can", "i", "my", "how", "what", "do", "with", "on"]);

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ");
}

function tokens(q: string) {
  const all = normalize(q).split(/[\s-]+/).filter(Boolean);
  const meaningful = all.filter((t) => !STOP.has(t));
  return meaningful.length ? meaningful : all;
}

/** Light stemming so "passports" matches "passport", "cards" matches "card". */
const stem = (t: string) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t);

const TYPE_BOOST: Record<SearchDocType, number> = { destination: 1.4, visa: 1.15, esim: 1.1, tool: 1.05, article: 1, topic: 0.8, country: 0.9 };

export function searchDocs(docs: SearchDoc[], query: string, limit = 30): SearchDoc[] {
  const qs = tokens(query).map(stem);
  if (!qs.length) return [];
  const scored = docs.map((d) => {
    const title = normalize(d.title);
    const desc = normalize(d.description);
    const kw = normalize(d.keywords);
    let matched = 0;
    let score = 0;
    for (const t of qs) {
      let s = 0;
      if (new RegExp(`\\b${t}`).test(title)) s += 6;
      else if (title.includes(t)) s += 3;
      if (kw.includes(t)) s += 4;
      if (desc.includes(t)) s += 1.5;
      if (s > 0) matched++;
      score += s;
    }
    const coverage = matched / qs.length;
    return { d, score: score * coverage * coverage * TYPE_BOOST[d.type], coverage };
  });
  // Prefer docs that match every term; fall back to partial matches.
  const full = scored.filter((s) => s.coverage === 1 && s.score > 0);
  const pool = full.length ? full : scored.filter((s) => s.score > 0);
  return pool.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.d);
}

export const SEARCH_EXAMPLES = ["Georgia", "eSIM South Africa", "Zimbabwe passport", "Airport Wi-Fi", "Before you fly"];
