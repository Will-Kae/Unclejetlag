/**
 * Fingerprints and change classification.
 *
 * Two hashes per check: the raw body (detects any change) and the normalised text (detects content
 * changes). Raw changed + text unchanged = cosmetic (audit only). Text changed = substantive: a
 * review item with before/after lines. "Substantive" means "a person must read this"; it never means
 * a visa policy has changed.
 *
 * Normalisation is deliberately conservative. It drops clock times and a short list of page-furniture
 * lines (last-updated stamps, copyright lines, visitor counters). It keeps dates and numbers in
 * content, because those are often the policy (stay lengths, effective dates).
 */
import { createHash } from "node:crypto";

export const sha256 = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");

const VOLATILE_LINES = [
  /^(page )?(last )?(updated|modified|reviewed|published)( on| at)?\s*[:\-]?\s*[\w ,./-]{0,40}$/i,
  /^(©|\(c\)|copyright)(\s|$).{0,120}$/i,
  /all rights reserved\.?$/i,
  /^(visitors?|hits|page views)\s*[:\-]?\s*[\d,]+$/i,
  /^(skip to (main )?content|back to top|print this page|share this page)$/i,
];

export function normaliseText(text: string): string {
  return text
    .split("\n")
    .map((l) => l.replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?\b/gi, " ").replace(/\s+/g, " ").trim().toLowerCase())
    .filter((l) => l && !VOLATILE_LINES.some((re) => re.test(l)))
    .join("\n");
}

export type LineDiff = { added: string[]; removed: string[] };

/** Line diff (LCS). Falls back to a multiset difference for very long documents. */
export function diffLines(before: string, after: string, maxLines = 4000): LineDiff {
  const a = before ? before.split("\n") : [];
  const b = after ? after.split("\n") : [];
  if (a.length * b.length > maxLines * maxLines / 4) {
    const count = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
    const ca = count(a), cb = count(b);
    const minus = (x: Map<string, number>, y: Map<string, number>, order: string[]) => {
      const left = new Map(y);
      return order.filter((l) => {
        const n = left.get(l) ?? 0;
        if (n > 0) { left.set(l, n - 1); return false; }
        return x.has(l);
      });
    };
    return { removed: minus(ca, cb, a), added: minus(cb, ca, b) };
  }
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const added: string[] = [], removed: string[] = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) removed.push(a[i++]);
    else added.push(b[j++]);
  }
  while (i < a.length) removed.push(a[i++]);
  while (j < b.length) added.push(b[j++]);
  return { added, removed };
}

export const POLICY_TERMS = ["visa", "exempt", "waiver", "e-visa", "evisa", "eta", "electronic travel", "on arrival", "suspend", "suspension", "require", "permit", "days", "months", "entry", "ban", "restrict", "reciproc", "effective", "fee"];

export type ChangeClass = "none" | "cosmetic" | "substantive";
export type Classification = { change: ChangeClass; priority: "high" | "normal" | "low"; signals: string[]; diff: LineDiff };

/**
 * Classify a check against the previous one. `watchNames` are lowercase names of jurisdictions whose
 * rules cite this source; a changed line that names one of them is high priority.
 */
export function classifyChange(prev: { rawHash?: string; textHash?: string; text?: string }, next: { rawHash: string; textHash: string; text: string }, watchNames: string[]): Classification {
  if (prev.rawHash === next.rawHash || prev.textHash === next.textHash) {
    return { change: prev.rawHash === next.rawHash ? "none" : "cosmetic", priority: "low", signals: [], diff: { added: [], removed: [] } };
  }
  const diff = diffLines(prev.text ?? "", next.text);
  const changed = [...diff.added, ...diff.removed];
  const names = watchNames.filter((n) => changed.some((l) => l.includes(n)));
  const terms = POLICY_TERMS.filter((t) => changed.some((l) => l.includes(t)));
  const signals = [...names.map((n) => `names:${n}`), ...terms.map((t) => `term:${t}`)];
  const priority = names.length || terms.some((t) => t.startsWith("suspen") || t === "ban") ? "high" : terms.length ? "normal" : "low";
  return { change: "substantive", priority, signals, diff };
}
