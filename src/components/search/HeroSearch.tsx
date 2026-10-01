"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { searchDocs, SEARCH_EXAMPLES } from "@/lib/search";
import { useSearchIndex } from "./useSearchIndex";
import { Search, Arrow } from "@/components/ui/icons";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/** "Where are you going?" — inline search with instant suggestions. */
export function HeroSearch({ className }: { className?: string }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const docs = useSearchIndex(focused || q.length > 0);
  const results = useMemo(() => (docs && q.trim() ? searchDocs(docs, q, 6) : []), [docs, q]);
  const showList = focused && results.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) track("destination_search", { query: q.trim().slice(0, 60), placement: "hero" });
    if (active >= 0 && results[active]) router.push(results[active].url);
    else if (q.trim()) router.push(routes.search(q.trim()));
  }

  return (
    <div className={cn("relative", className)}>
      <form role="search" onSubmit={submit} className="relative">
        <label htmlFor={`${id}-q`} className="sr-only">Where are you going?</label>
        <div className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-lift ring-1 ring-line focus-within:ring-2 focus-within:ring-jet">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            id={`${id}-q`}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(-1); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
              if (e.key === "Escape") setFocused(false);
            }}
            placeholder="Where are you going?"
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
            className="h-12 min-w-0 flex-1 bg-transparent text-[1.05rem] text-ink outline-none placeholder:text-muted"
          />
          <button type="submit" aria-label="Search" className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-paper transition hover:bg-jet">
            <span className="hidden sm:inline">Search</span>
            <Arrow className="h-5 w-5" />
          </button>
        </div>
        {showList && (
          <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 animate-fade overflow-hidden rounded-3xl bg-white p-2 shadow-lift ring-1 ring-line">
            {results.map((r, i) => (
              <li key={r.id} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}>
                <Link href={r.url} className={cn("flex items-baseline gap-3 rounded-2xl px-3 py-2.5", i === active ? "bg-sand" : "hover:bg-paper")}>
                  <span className="label-mono w-20 shrink-0 !text-[0.58rem] text-jet-ink">{r.label.split(" · ")[0]}</span>
                  <span className="line-clamp-1 font-medium text-ink">{r.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </form>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>Try:</span>
        {SEARCH_EXAMPLES.map((ex) => (
          <Link key={ex} href={routes.search(ex)} className="rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-ink-2 transition hover:border-jet hover:text-jet-ink">
            {ex}
          </Link>
        ))}
      </p>
    </div>
  );
}
