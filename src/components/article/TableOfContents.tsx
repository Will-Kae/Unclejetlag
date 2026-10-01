"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/content";
import { cn } from "@/lib/utils";

export function TableOfContents({ headings, collapsible = false }: { headings: Heading[]; collapsible?: boolean }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;
  const list = (
    <ol className="space-y-0.5 border-l border-line">
      {headings.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            className={cn(
              "-ml-px block border-l-2 py-1.5 text-[0.9rem] leading-snug transition",
              h.depth === 3 ? "pl-7 text-[0.85rem]" : "pl-4",
              active === h.id ? "border-jet font-medium text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  if (collapsible) {
    return (
      <details className="group rounded-2xl bg-white p-4 ring-1 ring-line lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
          <span className="label-mono text-ink">On this page</span>
          <span className="text-sm text-muted group-open:hidden">Show</span>
          <span className="hidden text-sm text-muted group-open:inline">Hide</span>
        </summary>
        <nav aria-label="Table of contents" className="mt-3">{list}</nav>
      </details>
    );
  }
  return (
    <nav aria-label="Table of contents">
      <p className="label-mono mb-3 text-muted">On this page</p>
      {list}
    </nav>
  );
}
