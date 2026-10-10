import Link from "next/link";
import type { Metadata } from "next";
import { ToolHero } from "@/components/banking/ToolHero";
import { PI, SubNav, h2, profileHref } from "@/components/passport/shared";
import { flagOf, jurisdictions, regions, scorePassport } from "@/lib/passport";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "All Passports: World Passport Index Directory",
  description: "Every passport in the Uncle Jetlag World Passport Index, by region, with how many destinations we've verified on official sources so far.",
  path: `${PI}/passports`,
  ogKicker: "World Passport Index",
});

export default function PassportsDirectory() {
  return (
    <>
      <ToolHero crumbs={[{ name: "World Passport Index", href: PI }, { name: "Passports", href: `${PI}/passports` }]} kicker="World Passport Index" title="All passports" intro={`${jurisdictions.length} passport-issuing jurisdictions: the UN member and observer states, Kosovo, Taiwan, Hong Kong and Macao. Numbers show verified destinations so far.`} />
      <SubNav current={`${PI}/passports`} />
      <div className="container-uj mt-12 space-y-12">
        {regions.map((r) => (
          <section key={r.key} aria-labelledby={`r-${r.key}`}>
            <h2 id={`r-${r.key}`} className={h2}>{r.label}</h2>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {jurisdictions.filter((j) => j.region === r.key).map((j) => {
                const n = scorePassport(j.code).verified;
                return (
                  <li key={j.code}>
                    <Link href={profileHref(j.slug)} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-line hover:bg-sand/40">
                      <span className="font-semibold text-ink">{flagOf(j.code)} {j.name}</span>
                      <span className={`text-xs ${n ? "font-semibold text-palm" : "text-muted"}`}>{n ? `${n} verified` : "In progress"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
