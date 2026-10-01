import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { Callout } from "./Callout";
import { ScrollTable, ComparisonTable } from "./Tables";
import { AffiliateButton, AffiliateDisclosure, PickCard, ProsCons } from "./Affiliate";
import { Placeholder, TBC } from "./Placeholder";
import { AdSlot } from "@/components/monetization/AdSlot";
import { ConverterCTA } from "@/components/tools/ConverterCTA";
import { EsimCTA } from "@/components/esim/EsimCTA";

function A({ href = "", children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/") || href.startsWith("#")) return <Link href={href} {...rest}>{children}</Link>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export const mdxComponents: MDXComponents = {
  a: A,
  table: ScrollTable,
  Callout,
  ComparisonTable,
  ProsCons,
  PickCard,
  AffiliateButton,
  AffiliateDisclosure,
  Placeholder,
  TBC,
  AdSlot,
  ConverterCTA,
  EsimCTA,
};
