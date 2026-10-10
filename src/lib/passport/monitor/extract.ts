/**
 * Text extraction for monitored sources: HTML (dependency-free) and PDF (pdfjs-dist, loaded on demand).
 *
 * Safety for PDFs: magic-number check, size already bounded by the fetcher, no XFA, no font loading,
 * page cap and a wall-clock timeout. A PDF with no text layer (a scan) is reported, not guessed at.
 * Per-source start/end markers trim navigation and footers so page furniture does not raise alerts;
 * a missing marker is reported because it usually means the page structure changed.
 */
export type ExtractConfig = { startMarker?: string; endMarker?: string };
export type ExtractResult =
  | { ok: true; text: string; markerMissing: boolean; pages?: number }
  | { ok: false; reason: "not-a-pdf" | "pdf-parse-failed" | "pdf-timeout" | "no-text" | "unsupported-content-type"; detail?: string };

export type PdfTextExtractor = (bytes: Uint8Array) => Promise<string[]>;

export const PDF_LIMITS = { maxPages: 200, timeoutMs: 20_000 } as const;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…" };

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : " ";
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Turn HTML into readable lines of text. Not a sanitiser: the output is only hashed and compared. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|template|svg|iframe|object|canvas)\b[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<(br|hr)\b[^>]*>/gi, "\n")
      .replace(/<\/?(p|div|section|article|header|footer|nav|main|aside|li|ul|ol|tr|table|tbody|thead|h[1-6]|dt|dd|dl|blockquote|pre|form|fieldset|figure|figcaption)\b[^>]*>/gi, "\n")
      .replace(/<\/(td|th)\s*>/gi, " | ")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").replace(/^\s*\|\s*|\s*\|\s*$/g, "").trim())
    .filter(Boolean)
    .join("\n");
}

export function applyMarkers(text: string, cfg: ExtractConfig): { text: string; markerMissing: boolean } {
  let out = text;
  let missing = false;
  const lower = () => out.toLowerCase();
  if (cfg.startMarker) {
    const i = lower().indexOf(cfg.startMarker.toLowerCase());
    if (i < 0) missing = true;
    else out = out.slice(i);
  }
  if (cfg.endMarker) {
    const i = lower().indexOf(cfg.endMarker.toLowerCase());
    if (i < 0) missing = true;
    else out = out.slice(0, i + cfg.endMarker.length);
  }
  return { text: out, markerMissing: missing };
}

export function charsetOf(contentType: string): string {
  const m = contentType.match(/charset\s*=\s*"?([\w-]+)"?/i);
  const cs = (m?.[1] ?? "utf-8").toLowerCase();
  return ["utf-8", "utf8", "iso-8859-1", "latin1", "windows-1252", "us-ascii"].includes(cs) ? cs : "utf-8";
}

export const isPdf = (bytes: Uint8Array) => bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";

/** pdfjs-dist text extraction with eval disabled, a page cap and a timeout. */
export const pdfjsExtractor: PdfTextExtractor = async (bytes) => {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: new Uint8Array(bytes), enableXfa: false, isOffscreenCanvasSupported: false, disableFontFace: true, useSystemFonts: false, stopAtErrors: true, verbosity: 0 });
  try {
    const doc = await task.promise;
    const pages: string[] = [];
    const n = Math.min(doc.numPages, PDF_LIMITS.maxPages);
    for (let i = 1; i <= n; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join(""));
    }
    return pages;
  } finally {
    await task.destroy();
  }
};

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("pdf-timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export async function extractText(contentType: string, body: Uint8Array, cfg: ExtractConfig, pdf: PdfTextExtractor = pdfjsExtractor, timeoutMs: number = PDF_LIMITS.timeoutMs): Promise<ExtractResult> {
  const type = contentType.split(";")[0].trim().toLowerCase();
  if (type === "application/pdf") {
    if (!isPdf(body)) return { ok: false, reason: "not-a-pdf" };
    let pages: string[];
    try {
      pages = await withTimeout(pdf(body), timeoutMs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return msg === "pdf-timeout" ? { ok: false, reason: "pdf-timeout" } : { ok: false, reason: "pdf-parse-failed", detail: msg.slice(0, 200) };
    }
    const text = pages.join("\n").split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
    if (!text) return { ok: false, reason: "no-text" };
    return { ok: true, ...applyMarkers(text, cfg), pages: pages.length };
  }
  if (type === "text/html" || type === "application/xhtml+xml" || type === "text/plain") {
    const raw = new TextDecoder(charsetOf(contentType)).decode(body);
    const text = type === "text/plain" ? raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join("\n") : htmlToText(raw);
    if (!text) return { ok: false, reason: "no-text" };
    return { ok: true, ...applyMarkers(text, cfg) };
  }
  return { ok: false, reason: "unsupported-content-type", detail: type };
}
