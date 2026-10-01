import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { footerNav, site } from "@/data/site";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { CookieSettingsButton } from "@/components/consent/CookieBanner";
import { YouTube, Instagram, TikTok, XLogo } from "@/components/ui/icons";

const socials = [
  { label: "YouTube", href: site.social.youtube, Icon: YouTube },
  { label: "Instagram", href: site.social.instagram, Icon: Instagram },
  { label: "TikTok", href: site.social.tiktok, Icon: TikTok },
  { label: "X", href: site.social.x, Icon: XLogo },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-paper" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="container-uj py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_2.4fr]">
          <div className="max-w-sm">
            <Logo inverted size="lg" />
            <p className="mt-5 leading-relaxed text-paper/70">
              Travel smarter. Go further. Stay connected. Independent travel intelligence and tools by Willard Munyaradzi Kachere, better known as Uncle Jetlag.
            </p>
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold">The Jetlag Report: travel intelligence worth opening</p>
              <NewsletterForm source="footer" tone="dark" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(footerNav).map(([title, links]) => (
              <nav key={title} aria-label={title}>
                <p className="label-mono text-paper/50">{title}</p>
                <ul className="mt-4 space-y-2.5">
                  {links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-[0.95rem] text-paper/85 hover:text-white hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {title === "Legal" && (
                    <li>
                      <CookieSettingsButton className="text-[0.95rem] text-paper/85 hover:text-white hover:underline" />
                    </li>
                  )}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="perforation mt-14 opacity-40 [background-image:linear-gradient(to_right,rgb(250_247_242/0.5)_55%,transparent_0)]" />

        <div className="mt-8 flex flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-paper/60">
            <p>© {new Date().getFullYear()} Uncle Jetlag. All rights reserved.</p>
            <p className="mt-1 font-display italic text-paper/80">World Wide Will.</p>
          </div>
          <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-paper/70">{site.socialHandle}</span>
          <ul className="flex items-center gap-2" aria-label="Social media">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer me" aria-label={`Uncle Jetlag on ${label}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 transition hover:bg-jet">
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              </li>
            ))}
          </ul>
          </div>
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-paper/65">
          Uncle Jetlag publishes general travel information, not legal, immigration or financial advice. Entry requirements, fees and
          product terms change, so always confirm with the relevant government, embassy or provider before you travel. Some links may be
          affiliate links; see our <Link href="/affiliate-disclosure" className="underline">Affiliate Disclosure</Link>.
        </p>
      </div>
    </footer>
  );
}
