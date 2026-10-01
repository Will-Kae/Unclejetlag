import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ContextCTA } from "@/components/partners/ContextCTA";
import { JsonLd } from "@/components/ui/JsonLd";
import { Wifi, Key, Phone, Lock, Shield, Alert } from "@/components/ui/icons";
import { buildMetadata, faqLd } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

const REVIEWED = "2026-10-01";

export const metadata: Metadata = buildMetadata({
  title: "Travel Security: Public Wi-Fi, Passwords & Your Phone Abroad",
  description:
    "Practical digital security for travellers: airport and hotel Wi-Fi, VPNs, password managers, two-factor codes abroad, lost phones, SIM swaps and travel scams.",
  path: "/security",
  ogKicker: "Travel Security",
});

const sections = [
  { id: "wifi", label: "Public Wi-Fi" },
  { id: "vpn", label: "VPNs, honestly" },
  { id: "passwords", label: "Passwords & passkeys" },
  { id: "2fa", label: "Two-factor codes abroad" },
  { id: "phone", label: "If your phone goes missing" },
  { id: "sim", label: "SIM security" },
  { id: "money-apps", label: "Banking apps" },
  { id: "scams", label: "Scams & phishing" },
  { id: "documents", label: "Digital document copies" },
  { id: "checklist", label: "Pre-flight checklist" },
];

const faqs = [
  { q: "Is airport Wi-Fi safe?", a: "It's usable, with care. Most sites and apps now encrypt traffic (HTTPS), which protects the content of what you send. The bigger risks are fake networks with convincing names, login pages that ask for too much, and devices with sharing turned on. Confirm the official network name with signage or staff, avoid entering passwords on captive portals, and use mobile data or a VPN for anything sensitive." },
  { q: "Does a VPN make me anonymous?", a: "No. A VPN encrypts the traffic between your device and the VPN server and hides it from the local network, such as hotel or café Wi-Fi. The websites you log into still know who you are, and the VPN provider can see your connection metadata. It's a useful layer, not an invisibility cloak." },
  { q: "Will my bank's SMS codes work abroad?", a: "Usually, if your home SIM stays active and can receive texts while roaming. Leave the SIM in (or keep it as a second line next to your travel eSIM) with data roaming off. Better still, switch to an authenticator app or passkeys before you travel where your bank supports them." },
  { q: "What should I do first if my phone is stolen abroad?", a: "Use another device to mark the phone as lost (Find My for iPhone, Find Hub for Android), which locks it. Then call your mobile network to block the SIM, change the passwords for email and banking, and report the theft to local police for an insurance reference." },
];

export default function SecurityHub() {
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="container-uj pb-14 pt-6 sm:pb-20 sm:pt-8">
          <div className="[&_a]:text-paper/80 [&_span]:text-paper/60">
            <Breadcrumbs items={[{ name: "Travel Security", href: "/security" }]} />
          </div>
          <div className="mt-10 max-w-3xl">
            <p className="label-mono text-[#ffb59e]">Uncle Jetlag Travel Security</p>
            <h1 className="mt-4 text-[clamp(2.4rem,1.4rem+4.4vw,4.8rem)] font-semibold uppercase leading-[0.95] tracking-[-0.03em]">
              Your passport isn&apos;t the only thing worth protecting.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/80">
              Your phone holds your boarding pass, your bank, your hotel booking and the only map you&apos;ve got. Here&apos;s how to keep it, and
              everything on it, yours. No fear-mongering, just the habits that actually matter.
            </p>
            <p className="mt-6 text-sm text-paper/55">Last reviewed {formatDate(REVIEWED)}</p>
          </div>
        </div>
      </section>

      <div className="container-uj mt-12 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <p className="label-mono text-muted">On this page</p>
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="block rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line hover:bg-sand lg:rounded-lg lg:bg-transparent lg:px-2 lg:ring-0">{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-[44rem] space-y-16 text-[1.05rem] leading-relaxed text-ink-2">
          <section id="wifi" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Wifi className="h-7 w-7 text-jet" /> Public Wi-Fi: airport, hotel, café</h2>
            <p className="mt-4">
              Free Wi-Fi is how most travellers get online on day one, and most of the time nothing bad happens. The risk isn&apos;t that every
              network is evil. It&apos;s that you can&apos;t tell which one is.
            </p>
            <ul className="mt-4 space-y-2">
              <li><strong className="text-ink">Check the network name.</strong> Attackers create look-alikes such as &ldquo;Airport_Free_WiFi&rdquo;. Confirm the official name on signs or with staff.</li>
              <li><strong className="text-ink">Be suspicious of greedy login pages.</strong> A Wi-Fi sign-in that asks for your email password or card details is a red flag.</li>
              <li><strong className="text-ink">Turn off sharing and auto-join.</strong> Disable AirDrop/Quick Share for everyone, file sharing, and &ldquo;auto-join&rdquo; for networks you used once.</li>
              <li><strong className="text-ink">Use mobile data for sensitive things.</strong> Banking and password changes are better on your eSIM&apos;s data than on shared Wi-Fi. <Link href="/esim" className="text-sky underline">Sort an eSIM</Link>.</li>
            </ul>
          </section>

          <section id="vpn" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Shield className="h-7 w-7 text-jet" /> VPNs, honestly</h2>
            <p className="mt-4">A VPN creates an encrypted tunnel between your device and the VPN provider&apos;s server. On a network you don&apos;t control, that means the hotel, the café or whoever set up a fake hotspot can&apos;t see or tamper with your traffic.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-palm-soft/60 p-5"><p className="label-mono text-palm">What it helps with</p><ul className="mt-2 space-y-1 text-[0.95rem]"><li>Snooping on public Wi-Fi</li><li>Networks that inject ads or block services</li><li>Reaching your home accounts from abroad in a familiar way</li></ul></div>
              <div className="rounded-2xl bg-jet-soft/60 p-5"><p className="label-mono text-jet-ink">What it doesn&apos;t do</p><ul className="mt-2 space-y-1 text-[0.95rem]"><li>Make you anonymous</li><li>Stop phishing or bad passwords</li><li>Override local laws on VPN use</li></ul></div>
            </div>
            <p className="mt-4 text-[0.95rem]">Some countries restrict or regulate VPNs. Check the rules for your destination before you rely on one.</p>
            <ContextCTA slug="nordvpn" placement="security-vpn" kicker="Travel with a VPN" title="Protect your connection on networks you don't control" className="mt-6">
              If you use hotel, airport or café Wi-Fi regularly, NordVPN is the VPN we suggest. Install and test it at home before you fly; app
              stores and sign-ups can be harder to reach abroad.
            </ContextCTA>
          </section>

          <section id="passwords" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Key className="h-7 w-7 text-jet" /> Passwords and passkeys</h2>
            <p className="mt-4">Travel concentrates your most valuable logins on one device: airline, hotel, email, banking. If one password is reused across them, one leak opens the lot.</p>
            <ul className="mt-4 space-y-2">
              <li><strong className="text-ink">One account, one password.</strong> Especially email: it&apos;s the reset key to everything else.</li>
              <li><strong className="text-ink">Turn on passkeys where offered.</strong> Airlines, banks and big platforms increasingly support them, and they can&apos;t be phished the way passwords can.</li>
              <li><strong className="text-ink">Never type passwords on shared computers.</strong> Hotel business-centre PCs are for printing boarding passes, not logging into email.</li>
            </ul>
            <ContextCTA slug="nordpass" placement="security-passwords" kicker="Digital travel security" title="Keep every travel login unique without memorising any" className="mt-6">
              A password manager generates and stores a different password for every account, so a breach at one hotel chain doesn&apos;t become a
              breach of your email. NordPass is the one we suggest for travellers.
            </ContextCTA>
          </section>

          <section id="2fa" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Lock className="h-7 w-7 text-jet" /> Two-factor codes abroad</h2>
            <p className="mt-4">The classic travel trap: you swap SIMs, then your bank texts a code to the number you just removed.</p>
            <ul className="mt-4 space-y-2">
              <li>Keep your home SIM active as a second line for SMS, with data roaming off.</li>
              <li>Move important accounts to an authenticator app or passkeys before you go.</li>
              <li>Save backup codes for email somewhere you can reach without your phone.</li>
            </ul>
          </section>

          <section id="phone" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Phone className="h-7 w-7 text-jet" /> If your phone goes missing</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5">
              <li>From another device, mark it lost (Find My on iPhone, Find Hub on Android). This locks it and shows a message.</li>
              <li>Call your mobile network to block the SIM so nobody can receive your codes.</li>
              <li>Change your email password first, then banking and payment apps.</li>
              <li>Freeze cards in your banking app or by phone.</li>
              <li>Report the theft to local police for a reference number for insurance.</li>
            </ol>
            <p className="mt-4">Before you travel: write down your network&apos;s lost-phone number and your bank&apos;s card-block number on paper. Yes, paper.</p>
          </section>

          <section id="sim" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">SIM security</h2>
            <p className="mt-4">SIM-swap fraud is when someone convinces your network to move your number to their SIM, then collects your verification texts. Ask your network about a SIM PIN or port-out protection, and set a PIN on the physical SIM so a stolen SIM can&apos;t be used in another phone.</p>
          </section>

          <section id="money-apps" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Banking and payment apps</h2>
            <ul className="mt-4 space-y-2">
              <li>Tell your bank you&apos;re travelling if it still asks; check whether its app works with your travel eSIM.</li>
              <li>Turn on instant spending notifications so you see a fraudulent charge the minute it happens.</li>
              <li>Carry a backup card in a different place from your main one. More in <Link href="/money" className="text-sky underline">Money Abroad</Link>.</li>
            </ul>
          </section>

          <section id="scams" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Alert className="h-7 w-7 text-jet" /> Scams and phishing</h2>
            <ul className="mt-4 space-y-2">
              <li><strong className="text-ink">Fake booking messages.</strong> &ldquo;Your reservation will be cancelled unless you confirm your card&rdquo;. Check inside the booking app, never via the link.</li>
              <li><strong className="text-ink">Visa look-alike sites.</strong> Unofficial sites charge extra for e-visas and travel authorisations. Use the government domain; our <Link href="/visas" className="text-sky underline">visa briefs</Link> link to the official source.</li>
              <li><strong className="text-ink">QR code stickers.</strong> Parking meters and menus are a favourite for swapped QR codes. Check the web address before paying.</li>
              <li><strong className="text-ink">&ldquo;Free&rdquo; charging cables and USB ports.</strong> Use your own plug and cable where you can.</li>
            </ul>
          </section>

          <section id="documents" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Digital copies of important documents</h2>
            <p className="mt-4">Keep a copy of your passport photo page, visa, insurance policy and bookings in an encrypted place you can reach from any device, plus an offline copy on your phone. Don&apos;t email them to yourself unencrypted and don&apos;t post photos of boarding passes: the barcode holds your booking details.</p>
          </section>

          <section id="checklist" className="scroll-mt-28 rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8">
            <h2 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-semibold text-ink">Phone pre-flight checklist</h2>
            <ul className="mt-4 space-y-2">
              {[
                "Update your phone's operating system and apps",
                "Set a strong passcode and turn on Find My / Find Hub",
                "Back up photos and data",
                "Install your travel eSIM on Wi-Fi",
                "Move key accounts to passkeys or an authenticator app",
                "Install and test your VPN at home",
                "Download offline maps and your boarding passes",
                "Save emergency numbers and your bank's card-block number",
                "Turn off auto-join Wi-Fi and file sharing",
              ].map((i) => (
                <li key={i} className="flex gap-3"><input type="checkbox" className="mt-1.5 h-4 w-4 accent-[var(--color-jet,#cf3d17)]" aria-label={i} /><span>{i}</span></li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted">Want the full trip version? <Link href="/tools/before-you-fly" className="font-semibold text-sky underline">Build a Before You Fly checklist</Link>.</p>
          </section>

          <section aria-labelledby="sec-faq">
            <h2 id="sec-faq" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Questions</h2>
            <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              {faqs.map((f) => (
                <details key={f.q}>
                  <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">{f.q}</summary>
                  <p className="px-5 pb-5 text-[0.98rem] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
          <p className="text-sm text-muted">
            General security information, not a guarantee of protection. NordVPN and NordPass are affiliate partners; see our{" "}
            <Link href="/affiliate-disclosure" className="underline">affiliate disclosure</Link>.
          </p>
        </article>
      </div>
      <JsonLd data={faqLd(faqs)} />
    </>
  );
}
