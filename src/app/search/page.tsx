import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/search/SearchResults";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search Uncle Jetlag guides on destinations, visas, money abroad and travel tech.",
  path: "/search",
  noindex: true,
});

export default function SearchPage() {
  return (
    <section className="container-uj min-h-[60vh] pb-10 pt-10">
      <h1 className="sr-only">Search Uncle Jetlag</h1>
      <Suspense fallback={<p className="text-muted">Loading search…</p>}>
        <SearchResults />
      </Suspense>
    </section>
  );
}
