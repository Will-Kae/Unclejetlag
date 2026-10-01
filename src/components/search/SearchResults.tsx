"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { searchDocs, SEARCH_EXAMPLES, type SearchDocType } from "@/lib/search";
import { useSearchIndex } from "./useSearchIndex";
import { Search } from "@/components/ui/icons";
import { routes } from "@/lib/routes";
import { cn, formatDate } from "@/lib/utils";

const FILTERS: { key: "all" | SearchDocType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "destination", label: "Destinations" },
  { key: "visa", label: "Visa briefs" },
  { key: "esim", label: "eSIM" },
  { key: "tool", label: "Tools" },
  { key: "article", label: "Articles" },
  { key: "topic", label: "Topics" },
  { key: "country", label: "Countries" },
];

export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const docs = useSearchIndex(true);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- sync input when URL changes (back/forward)
  useEffect(() => setQ(initial), [initial]);

  const all = useMemo(() => (docs && initial.trim() ? searchDocs(docs, initial, 60) : []), [docs, initial]);
  const results = filter === "all" ? all : all.filter((r) => r.type === filter);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.replace(routes.search(q.trim()));
  }

  return (
    <div>
      <p className="font-display text-[clamp(2rem,1.5rem+2.5vw,3.2rem)] font-semibold leading-tight" aria-live="polite">
        {initial ? <>Results for “{initial}”</> : "Search Uncle Jetlag"}
      </p>
      <form role="search" onSubmit={submit} className="mt-6 flex max-w-2xl items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-card ring-1 ring-line focus-within:ring-2 focus-within:ring-jet">
        <Search className="h-5 w-5 text-muted" />
        <label htmlFor="search-q" className="sr-only">Search</label>
        <input id="search-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Where are you going?" className="h-11 min-w-0 flex-1 bg-transparent outline-none" />
        <button className="h-11 rounded-full bg-ink px-5 font-semibold text-paper">Search</button>
      </form>

      {initial && (
        <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto" role="tablist" aria-label="Filter results">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? all.length : all.filter((r) => r.type === f.key).length;
            if (f.key !== "all" && count === 0) return null;
            return (
              <button key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)} className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-line", filter === f.key ? "bg-ink text-paper" : "bg-white")}>
                {f.label} <span className="font-mono text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8" aria-live="polite">
        {!initial && (
          <div>
            <p className="text-muted">Popular searches:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SEARCH_EXAMPLES.map((ex) => (
                <Link key={ex} href={routes.search(ex)} className="rounded-full bg-white px-4 py-2 text-sm ring-1 ring-line hover:ring-jet">{ex}</Link>
              ))}
            </div>
          </div>
        )}
        {initial && docs === null && (
          <ul className="space-y-3" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <li key={i} className="h-24 animate-pulse rounded-2xl bg-sand" />)}
          </ul>
        )}
        {initial && docs && results.length === 0 && (
          <div className="rounded-3xl border border-dashed border-ink/20 p-8">
            <p className="font-display text-2xl font-semibold">Nothing yet for “{initial}”.</p>
            <p className="mt-2 max-w-xl text-muted">Try a country name (“Georgia”), a passport (“Zimbabwe passport”) or a topic (“eSIM”, “bank account”, “ATM”).</p>
          </div>
        )}
        {results.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted">{results.length} result{results.length === 1 ? "" : "s"}</p>
            <ul className="space-y-3">
              {results.map((r) => (
                <li key={r.id}>
                  <Link href={r.url} className="card-lift block rounded-2xl bg-white p-5 ring-1 ring-line">
                    <span className="label-mono !text-[0.62rem] text-jet-ink">{r.label}</span>
                    <span className="mt-1 block font-display text-xl font-semibold text-ink">{r.title}</span>
                    <span className="mt-1 block text-[0.95rem] text-muted">{r.description}</span>
                    {r.date && <span className="mt-2 block text-xs text-muted">Updated {formatDate(r.date)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
