import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Mail } from "@/components/ui/icons";
import { site } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact Uncle Jetlag",
  description: "Get in touch with Uncle Jetlag for corrections, story tips, partnerships and general questions.",
  path: "/contact",
  ogKicker: "Contact",
});

const channels = [
  { t: "General", d: "Questions, feedback, or just a good travel story.", e: site.email.general },
  { t: "Enquiries, tips & corrections", d: "Rule changes, border experiences, or something outdated or wrong. We fix fast and note the change.", e: site.email.enquiries },
  { t: "Partnerships", d: "Advertising, sponsorships and affiliate partnerships. Partners never influence editorial.", e: site.email.partnerships },
  { t: "Legal & privacy", d: "Privacy requests, data questions and legal notices.", e: site.email.legal },
  { t: "Newsletter", d: "Questions about the Uncle Jetlag newsletter or your subscription.", e: site.email.newsletter },
];

export default function ContactPage() {
  return (
    <section className="container-uj pb-8 pt-6 sm:pt-8">
      <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />
      <h1 className="mt-10 text-[clamp(2.3rem,1.5rem+3.5vw,4rem)] font-semibold leading-[1.02]">Say hello.</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        We read everything. We can&apos;t give personal immigration, legal or financial advice. For that, please contact the relevant embassy,
        government office or a licensed professional.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {channels.map((c) => (
          <li key={c.t} className="rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-line">
            <p className="font-display text-xl font-semibold">{c.t}</p>
            <p className="mt-1.5 text-muted">{c.d}</p>
            <a href={`mailto:${c.e}`} className="mt-4 inline-flex items-center gap-2 font-semibold text-sky underline">
              <Mail className="h-4 w-4" /> {c.e}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-muted">
        <span className="font-semibold text-ink">Postal address:</span> Uncle Jetlag, {site.address.street}, {site.address.locality},{" "}
        {site.address.region}, {site.address.postalCode}, {site.address.country}
      </p>
    </section>
  );
}
