"use client";

import { useEffect, useState } from "react";
import type { SearchDoc } from "@/lib/search";

let cached: Promise<SearchDoc[]> | null = null;

export function loadSearchIndex() {
  if (!cached) {
    cached = fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => {
        cached = null;
        return [];
      });
  }
  return cached;
}

export function useSearchIndex(enabled = true) {
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadSearchIndex().then((d) => alive && setDocs(d));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return docs;
}
