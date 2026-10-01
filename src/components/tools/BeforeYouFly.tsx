"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { cn, formatDate } from "@/lib/utils";

type Guide = { url: string; name: string; updated: string; currency: string; plugs: string; airports: string[]; emergency: string[]; official: { title: string; url: string }[] };

export type BYFData = {
  countries: { slug: string; name: string }[];
  guides: Record<string, Guide>;
  briefs: Record<string, { url: string; verified: string; title: string }>;
  esim: string[];
  links: Partial<Record<"passport" | "apps" | "power" | "pay" | "jetlag", string>>;
};

type Item = { id: string; title: string; body: React.ReactNode; tag?: "verified" | "check-official" | "general" };
type Group = { key: string; label: string; items: Item[] };

const A = ({ href, children }: { href: string; children: React.ReactNode }) =>
  href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noopener" className="font-medium text-sky underline">{children}</a>
  ) : (
    <Link href={href} className="font-medium text-sky underline">{children}</Link>
  );

const TAG = {
  verified: { label: "From our verified guide", cls: "bg-palm-soft text-palm" },
  "check-official": { label: "Confirm with official source", cls: "bg-amber-soft text-amber" },
  general: { label: "General advice", cls: "bg-sand text-ink-2" },
};

export function BeforeYouFly({ data }: { data: BYFData }) {
  const id = useId();
  const [dest, setDest] = useState("");
  const [nat, setNat] = useState("");
  const [days, setDays] = useState(10);
  const [date, setDate] = useState("");
  const [built, setBuilt] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const destName = data.countries.find((c) => c.slug === dest)?.name ?? "";
  const natName = data.countries.find((c) => c.slug === nat)?.name ?? "";
  const g = data.guides[dest];
  const brief = data.briefs[`${nat}--${dest}`];
  const hasEsim = data.esim.includes(dest);
  const daysToGo = date ? Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000) : null;

  const groups: Group[] = useMemo(() => {
    if (!built) return [];
    const docs: Item[] = [
      {
        id: "passport",
        title: "Passport validity and blank pages",
        tag: "check-official",
        body: (
          <>Many countries want your passport valid for months beyond your stay and need blank pages for stamps. Check {destName}&apos;s rule on the official government site.{data.links.passport && <> Background: <A href={data.links.passport}>the six-month passport rule</A>.</>}</>
        ),
      },
      nat === dest
        ? { id: "visa", title: "Entry", tag: "general", body: <>You&apos;re travelling to your own country of citizenship, so a visa shouldn&apos;t apply. Carry your passport or national ID as required.</> }
        : brief
          ? { id: "visa", title: "Visa / entry requirements", tag: "verified", body: <>We have a brief for exactly this trip: <A href={brief.url}>{brief.title}</A>. Last checked {formatDate(brief.verified)}. Rules change, so re-check the linked official source before you book.</> }
          : {
              id: "visa",
              title: "Visa / entry requirements",
              tag: "check-official",
              body: (
                <>
                  We don&apos;t have a verified brief for {natName} passports to {destName} yet. Check the {destName} government&apos;s official immigration or e-visa
                  website, and your own foreign ministry&apos;s travel advice. Avoid unofficial visa sites that add fees.{" "}
                  {g?.official.length ? <>Official sources we use for {destName}: {g.official.map((o, i) => <span key={o.url}>{i > 0 && "; "}<A href={o.url}>{o.title}</A></span>)}.</> : <A href="/visas#finder">Open the visa finder</A>}
                </>
              ),
            },
      { id: "insurance", title: "Travel insurance", tag: "check-official", body: <>Check what your policy covers for {days} days in {destName}, including medical evacuation. Some countries require proof of cover at the border{g ? <>; our <A href={g.url}>{g.name} guide</A> covers {g.name}&apos;s rules</> : <>; confirm on the official entry page</>}.</> },
      { id: "copies", title: "Digital copies of documents", tag: "general", body: <>Save your passport photo page, visa, insurance and bookings offline on your phone and in an encrypted cloud folder. <A href="/security#documents">How to store them safely</A>.</> },
    ];
    const connect: Item[] = [
      { id: "esim", title: "Mobile data (eSIM)", tag: "general", body: <>Install a travel eSIM at home on Wi-Fi. {hasEsim ? <A href={`/esim/${dest}`}>Our {destName} eSIM guide</A> : <A href="/esim">Use the eSIM Finder</A>} to estimate data for {days} days.</> },
      { id: "vpn", title: "Public Wi-Fi protection", tag: "general", body: <>If you&apos;ll use hotel or airport Wi-Fi, set up and test a VPN before you leave. <A href="/security#vpn">What a VPN does and doesn&apos;t do</A>.</> },
      { id: "2fa", title: "Bank codes and passwords", tag: "general", body: <>Keep your home SIM active for SMS codes, move key accounts to passkeys or an authenticator app, and use unique passwords. <A href="/security#2fa">Two-factor codes abroad</A>.</> },
      { id: "apps", title: "Apps and offline maps", tag: "general", body: <>Download offline maps of {destName}, your airline app and a translation app.{data.links.apps && <> <A href={data.links.apps}>Apps worth installing</A>.</>}</> },
    ];
    const money: Item[] = [
      { id: "currency", title: "Currency", tag: g ? "verified" : "general", body: <>{g ? <>{g.name} uses the {g.currency}. </> : null}Check today&apos;s mid-market rate on the <A href="https://converter.qefxmoney.com">QeFX converter</A> so you can spot a bad exchange rate (QeFX is owned by our founder).</> },
      { id: "cards", title: "Cards and cash", tag: "general", body: <>Carry two cards from different banks, pay in local currency when asked, and keep a little cash.{data.links.pay && <> <A href={data.links.pay}>Best ways to pay abroad</A>.</>}</> },
    ];
    const health: Item[] = [
      { id: "health", title: "Vaccinations and medicines", tag: "check-official", body: <>Check official travel-health advice for {destName} from your government&apos;s travel health service or a travel clinic, ideally several weeks before departure. Carry prescriptions in original packaging. Uncle Jetlag doesn&apos;t give medical advice.</> },
      { id: "emergency", title: "Emergency information", tag: g ? "verified" : "check-official", body: g ? <>{g.emergency.join(" · ")}. Also save your embassy&apos;s contact details in {destName}.</> : <>Save {destName}&apos;s emergency number from an official source and your embassy&apos;s contact details.</> },
    ];
    const logistics: Item[] = [
      { id: "power", title: "Power adapter", tag: g ? "verified" : "general", body: <>{g ? <>{g.name}: {g.plugs}. </> : <>Check {destName}&apos;s plug type and voltage. </>}{data.links.power && <A href={data.links.power}>Adapters and voltage explained</A>}</> },
      { id: "transport", title: "Airport to accommodation", tag: g ? "verified" : "general", body: <>{g ? <>Main airports: {g.airports.join("; ")}. </> : null}Decide how you&apos;ll get from the airport before you land; arrival halls are where taxi pricing is worst.{g && <> See <A href={g.url}>getting around {g.name}</A>.</>}</> },
      { id: "stay", title: "Accommodation", tag: "general", body: <>Save the address in the local language and script, plus the booking confirmation offline. Some borders ask where you&apos;re staying.</> },
      { id: "packing", title: "Packing", tag: "general", body: <>Pack for {days} days with a laundry stop if it&apos;s longer than a week. Medicines, chargers and documents go in your hand luggage.{data.links.jetlag && <> Crossing time zones? <A href={data.links.jetlag}>Beat jet lag</A>.</>}</> },
    ];
    return [
      { key: "docs", label: "Documents & entry", items: docs },
      { key: "connect", label: "Connectivity & security", items: connect },
      { key: "money", label: "Money", items: money },
      { key: "health", label: "Health & safety", items: health },
      { key: "logistics", label: "Logistics", items: logistics },
    ];
  }, [built, dest, nat, days, destName, natName, g, brief, hasEsim, data.links]);

  const total = groups.reduce((n, gr) => n + gr.items.length, 0);
  const ticked = groups.reduce((n, gr) => n + gr.items.filter((i) => done[i.id]).length, 0);

  function build(e: React.FormEvent) {
    e.preventDefault();
    if (!dest || !nat) return;
    setBuilt(true);
    setDone({});
    track("travel_tool_open", { tool: "before-you-fly", destination: dest, nationality: nat, days });
  }

  const field = "mt-2 h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-[1rem] text-ink focus:border-jet focus:outline-none focus:ring-2 focus:ring-jet/30";

  return (
    <div>
      <form onSubmit={build} className="grid gap-5 rounded-[1.5rem] bg-white p-6 ring-1 ring-line sm:grid-cols-2 sm:p-8 lg:grid-cols-[1fr_1fr_0.6fr_0.9fr_auto] lg:items-end print:hidden">
        <div>
          <label htmlFor={`${id}-d`} className="label-mono text-muted">Destination</label>
          <select id={`${id}-d`} required value={dest} onChange={(e) => setDest(e.target.value)} className={field}>
            <option value="">Where to?</option>
            {data.countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-n`} className="label-mono text-muted">Your passport</label>
          <select id={`${id}-n`} required value={nat} onChange={(e) => setNat(e.target.value)} className={field}>
            <option value="">Nationality</option>
            {data.countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-l`} className="label-mono text-muted">Days</label>
          <input id={`${id}-l`} type="number" min={1} max={365} inputMode="numeric" value={days} onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))} className={field} />
        </div>
        <div>
          <label htmlFor={`${id}-t`} className="label-mono text-muted">Departure (optional)</label>
          <input id={`${id}-t`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </div>
        <button type="submit" className="h-12 rounded-full bg-jet px-7 font-semibold text-white transition hover:bg-jet-ink">Build checklist</button>
      </form>

      <div aria-live="polite">
        {built && (
          <div className="mt-10">
            <div className="flex flex-col gap-4 border-b border-ink pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="label-mono text-jet-ink">{natName} passport → {destName} · {days} days{daysToGo !== null && daysToGo >= 0 ? ` · ${daysToGo} days to go` : ""}</p>
                <h2 className="mt-2 font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold">Your Before You Fly checklist</h2>
              </div>
              <div className="flex items-center gap-3 print:hidden">
                <span className="font-mono text-sm text-muted">{ticked}/{total} done</span>
                <button type="button" onClick={() => window.print()} className="h-10 rounded-full border border-ink/15 px-4 text-sm font-semibold hover:border-ink/40">Print / save PDF</button>
              </div>
            </div>
            {daysToGo !== null && daysToGo >= 0 && daysToGo < 21 && (
              <p className="mt-5 rounded-xl bg-amber-soft p-4 text-[0.95rem] text-ink-2">
                You fly in {daysToGo} {daysToGo === 1 ? "day" : "days"}. If you need a visa, start now: processing times vary and some take weeks.
              </p>
            )}
            {!g && (
              <p className="mt-5 rounded-xl bg-sand/70 p-4 text-[0.95rem] text-ink-2">
                We haven&apos;t published a verified {destName} guide yet, so destination-specific items point you to official sources instead of guessing.
              </p>
            )}
            <div className="mt-8 grid gap-10 lg:grid-cols-2">
              {groups.map((gr) => (
                <section key={gr.key} aria-labelledby={`${id}-${gr.key}`}>
                  <h3 id={`${id}-${gr.key}`} className="label-mono text-muted">{gr.label}</h3>
                  <ul className="mt-3 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
                    {gr.items.map((it) => (
                      <li key={it.id} className="flex gap-4 p-5">
                        <input
                          type="checkbox"
                          id={`${id}-${it.id}`}
                          checked={!!done[it.id]}
                          onChange={(e) => setDone((d) => ({ ...d, [it.id]: e.target.checked }))}
                          className="mt-1 h-5 w-5 shrink-0 accent-[#cf3d17]"
                        />
                        <div className="min-w-0">
                          <label htmlFor={`${id}-${it.id}`} className={cn("cursor-pointer font-semibold text-ink", done[it.id] && "text-muted line-through")}>{it.title}</label>
                          <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-2">{it.body}</p>
                          {it.tag && <span className={cn("label-mono mt-2 inline-block rounded-full px-2 py-0.5 !text-[0.55rem]", TAG[it.tag].cls)}>{TAG[it.tag].label}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">
              General travel information, not legal, immigration or medical advice. Requirements change; always confirm with the official government
              source before you travel.{g && <> {g.name} guide last updated {formatDate(g.updated)}.</>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
