import { NewsletterForm } from "./NewsletterForm";
import { LogoMark } from "@/components/ui/Logo";

export function NewsletterSection({ source = "section" }: { source?: string }) {
  return (
    <section aria-labelledby="newsletter-title" className="container-uj">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-paper sm:px-12 sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-jet/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-sky/40 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="label-mono flex items-center gap-2 text-paper/70">
              <LogoMark className="h-7 w-7" /> The Jetlag Report · weekly-ish
            </p>
            <h2 id="newsletter-title" className="mt-4 text-[clamp(2rem,1.4rem+2.6vw,3.2rem)] font-semibold leading-[1.05]">
              Travel intelligence worth opening.
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-paper/75">
              Rule changes, destination ideas, tools and deals worth knowing about, plus the odd Uncle Jetlag observation. No spam, no daily blasts, unsubscribe anytime.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 sm:p-6">
            <NewsletterForm source={source} tone="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
