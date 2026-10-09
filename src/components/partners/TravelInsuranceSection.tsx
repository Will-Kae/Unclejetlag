import { getPartner } from "@/data/partners";
import { ArrowUpRight, Shield, Globe } from "@/components/ui/icons";
import { CjImpressionPixel } from "@/components/partners/CjImpressionPixel";

/**
 * Travel Insurance & International Health Cover (Jetlag Guides hub).
 *
 * Partners: World Nomads (CJ link + CJ impression pixel) and Genki (official calculator iframe + product links).
 * Links go straight to each partner's issued tracking URL, unmodified, read from the partner registry.
 * Descriptions are deliberately factual: no benefits, prices, exclusions or eligibility are claimed here.
 */
const WN_PIXEL = "https://www.lduhtrp.net/image-101899765-15403748";
const GENKI_CALCULATOR = "https://widgets.genki.world/calculator?hue=111&saturation=46&with=unclejetlag";

function PartnerLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={
        variant === "primary"
          ? "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#101c30] px-6 py-3 font-semibold text-white transition hover:opacity-90 sm:w-auto"
          : "inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#101c30]/20 bg-white px-6 py-3 font-semibold text-[#101c30] transition hover:border-[#101c30]/50 sm:w-auto"
      }
    >
      {children}
      <ArrowUpRight className="h-4 w-4" />
    </a>
  );
}

function ProviderTag({ children }: { children: React.ReactNode }) {
  return <p className="label-mono text-[0.7rem] text-muted">{children}</p>;
}

export function TravelInsuranceSection({ className = "mt-20" }: { className?: string }) {
  const wn = getPartner("worldnomads");
  const traveler = getPartner("genki-traveler");
  const native = getPartner("genki-native");
  if (!wn?.active && !traveler?.active && !native?.active) return null;

  return (
    <section id="travel-insurance" aria-labelledby="travel-insurance-heading" className={`container-uj scroll-mt-24 ${className}`}>
      <p className="label-mono mb-3 text-jet-ink">Protect your trip</p>
      <h2 id="travel-insurance-heading" className="text-[clamp(1.75rem,1.2rem+2vw,2.6rem)] font-semibold leading-[1.08] text-ink">
        Travel Insurance &amp; International Health Cover
      </h2>
      <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
        Explore travel insurance and international health coverage options for your next adventure, whether you&apos;re taking a short holiday or spending an extended period abroad.
      </p>

      {/* World Nomads */}
      {wn?.active && (
        <article aria-labelledby="wn-heading" className="relative mt-8 rounded-[var(--radius-card)] bg-[#101c30] p-6 text-white shadow-card sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Shield className="h-5 w-5" />
                </span>
                <p className="label-mono text-[0.7rem] text-white/70">Provider: World Nomads</p>
              </div>
              <h3 id="wn-heading" className="mt-5 text-2xl font-semibold leading-tight">World Nomads Travel Insurance</h3>
              <p className="mt-3 leading-relaxed text-white/80">
                Explore travel insurance options for international holidays, backpacking and adventure travel.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Check the policy wording for what is and isn&apos;t covered, and whether you&apos;re eligible from your country of residence, before you buy.
              </p>
            </div>
            <a
              href={wn.url}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#101c30] transition hover:bg-white/90 md:w-auto"
            >
              {wn.cta}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <CjImpressionPixel src={WN_PIXEL} />
        </article>
      )}

      {/* Genki: official calculator, with its two products beside it (below it on phones) */}
      {(traveler?.active || native?.active) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr] lg:items-start">
          <article aria-labelledby="genki-heading" className="rounded-[var(--radius-card)] bg-[#f8fafc] p-4 ring-1 ring-line sm:p-6">
            <div className="flex items-center gap-3 px-2 sm:px-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#101c30] text-white">
                <Globe className="h-5 w-5" />
              </span>
              <div>
                <ProviderTag>Provider: Genki</ProviderTag>
                <h3 id="genki-heading" className="text-xl font-semibold leading-tight text-ink">Genki health insurance calculator</h3>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              {/* Official Genki embed. Attributes kept as issued; only the outer width is capped so it fits phones. */}
              <iframe
                width="400"
                height="640"
                loading="lazy"
                title="Genki International Health Insurance Calculator"
                style={{ background: "transparent", border: "none", maxWidth: "100%" }}
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts"
                src={GENKI_CALCULATOR}
              />
            </div>
          </article>

          <div className="grid gap-6">
            {traveler?.active && (
              <article aria-labelledby="genki-traveler-heading" className="flex flex-col rounded-[var(--radius-card)] bg-white p-6 shadow-card ring-1 ring-line">
                <ProviderTag>Provider: Genki</ProviderTag>
                <h3 id="genki-traveler-heading" className="mt-2 text-xl font-semibold text-ink">Genki Traveler</h3>
                <p className="mt-2 leading-relaxed text-muted">An international travel health insurance option for trips abroad.</p>
                <div className="mt-5"><PartnerLink href={traveler.url}>{traveler.cta}</PartnerLink></div>
              </article>
            )}
            {native?.active && (
              <article aria-labelledby="genki-native-heading" className="flex flex-col rounded-[var(--radius-card)] bg-white p-6 shadow-card ring-1 ring-line">
                <ProviderTag>Provider: Genki</ProviderTag>
                <h3 id="genki-native-heading" className="mt-2 text-xl font-semibold text-ink">Genki Native</h3>
                <p className="mt-2 leading-relaxed text-muted">A longer-term international health insurance option for people living abroad.</p>
                <div className="mt-5"><PartnerLink href={native.url} variant="ghost">{native.cta}</PartnerLink></div>
              </article>
            )}
          </div>
        </div>
      )}

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
        Uncle Jetlag may earn a commission from qualifying purchases through our partner links. Insurance coverage, eligibility, exclusions and terms are determined by the respective insurance providers. Uncle Jetlag is not an insurer or insurance broker, and this isn&apos;t personal advice.{" "}
        <a href="/affiliate-disclosure" className="underline">How this works</a>
      </p>
    </section>
  );
}
