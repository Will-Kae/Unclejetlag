import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { SearchTrigger } from "@/components/search/SearchTrigger";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="container-uj flex min-h-[70vh] flex-col items-start justify-center py-20">
      <p className="label-mono text-jet-ink">Error 404 · Gate closed</p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2.4rem,1.5rem+4vw,4.5rem)] font-semibold leading-[1.02]">
        You&apos;ve landed at the wrong terminal.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
        This page has either departed, been rebooked, or never existed. Happens to the best of us, usually at 3am in a transit zone.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/">Back to arrivals</ButtonLink>
        <SearchTrigger className="h-11 rounded-full border border-ink/15 bg-white px-5 font-semibold">Search the site</SearchTrigger>
      </div>
      <div className="perforation my-12 w-full" />
      <p className="text-sm text-muted">
        Popular gates: <Link href="/destinations" className="underline">Destinations</Link> ·{" "}
        <Link href="/visas" className="underline">Visas</Link> · <Link href="/money" className="underline">Money Abroad</Link> ·{" "}
        <Link href="/travel-tech" className="underline">Travel Tech</Link>
      </p>
    </section>
  );
}
