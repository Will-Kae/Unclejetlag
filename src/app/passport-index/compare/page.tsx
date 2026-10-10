import type { Metadata } from "next";
import { ToolHero } from "@/components/banking/ToolHero";
import { CompareTool } from "@/components/passport/CompareTool";
import { PI, SubNav } from "@/components/passport/shared";
import { rules } from "@/lib/passport";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Compare Passports: Side-by-Side Visa Access",
  description: "Compare two passports side by side: where both can travel without a visa in advance, and where only one can. Verified official sources only.",
  path: `${PI}/compare`,
  ogKicker: "World Passport Index",
});

export default function ComparePage() {
  const withData = Array.from(new Set(rules.map((r) => r.passport)));
  return (
    <>
      <ToolHero crumbs={[{ name: "World Passport Index", href: PI }, { name: "Compare", href: `${PI}/compare` }]} kicker="World Passport Index" title="Compare passports" intro="Pick two passports to see where both can go without a visa in advance, and where only one can. We only compare destinations verified for both, using the same dataset and methodology." />
      <SubNav current={`${PI}/compare`} />
      <div className="container-uj mt-10 max-w-[64rem]"><CompareTool withData={withData} /></div>
    </>
  );
}
