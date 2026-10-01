"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchDocs, SEARCH_EXAMPLES } from "@/lib/search";
import { useSearchIndex } from "./useSearchIndex";
import { Search, Close, Arrow } from "@/components/ui/icons";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const docs = useSearchIndex(open);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => (docs && q.trim() ? searchDocs(docs, q, 8) : []), [docs, q]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  function go(url: string) {
    onClose();
    setQ("");
    router.push(url);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(results[active].url);
      else if (q.trim()) go(routes.search(q.trim()));
    } else if (e.key === "Tab" && dialogRef.current) {
      // simple focus trap
      const f = dialogRef.current.querySelectorAll<HTMLElement>("a,button,input");
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  return (
    <div className="fixed inset-0 z-[70]" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 animate-fade bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search Uncle Jetlag"
        className="relative mx-auto mt-0 flex max-h-[100dvh] w-full max-w-2xl animate-rise flex-col overflow-hidden bg-paper shadow-lift sm:mt-[10vh] sm:max-h-[75vh] sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 sm:px-5">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Where are you going? Try “Zimbabwe passport”"
            aria-label="Search destinations, visas, money and guides"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${active}` : undefined}
            className="h-16 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted/80"
          />
          <button onClick={onClose} className="rounded-full p-2 hover:bg-sand" aria-label="Close search">
            <Close className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-2 sm:p-3">
          {!q.trim() && (
            <div className="p-3">
              <p className="label-mono text-muted">Popular searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SEARCH_EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => setQ(ex)} className="rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-sm hover:border-jet hover:text-jet-ink">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
          {q.trim() && docs === null && <p className="p-4 text-sm text-muted">Loading the atlas…</p>}
          {q.trim() && docs && results.length === 0 && (
            <p className="p-4 text-sm text-muted">No matches for “{q}” yet. Try a country name, or a topic like “eSIM” or “bank account”.</p>
          )}
          {results.length > 0 && (
            <ul id="search-results" role="listbox" className="space-y-1">
              {results.map((r, i) => (
                <li key={r.id} id={`sr-${i}`} role="option" aria-selected={i === active}>
                  <Link
                    href={r.url}
                    onClick={(e) => { e.preventDefault(); go(r.url); }}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex items-start gap-3 rounded-2xl px-3 py-3", i === active ? "bg-white shadow-card" : "hover:bg-white/60")}
                  >
                    <span className="label-mono mt-0.5 w-24 shrink-0 !text-[0.6rem] text-jet-ink">{r.label}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold leading-snug text-ink">{r.title}</span>
                      <span className="mt-0.5 line-clamp-1 block text-sm text-muted">{r.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {q.trim() && (
            <button
              onClick={() => go(routes.search(q.trim()))}
              className={cn("mt-1 flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold", active === results.length ? "bg-white shadow-card" : "hover:bg-white/60")}
            >
              See all results for “{q.trim()}” <Arrow className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="hidden border-t border-line px-5 py-2.5 text-xs text-muted sm:block">
          <kbd className="font-mono">↑↓</kbd> navigate · <kbd className="font-mono">Enter</kbd> open · <kbd className="font-mono">Esc</kbd> close
        </div>
      </div>
    </div>
  );
}
