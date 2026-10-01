import type { Metadata } from "next";
import { ArticlePage, articleMetadata, articleStaticParams } from "@/components/pages/ArticlePage";

export const dynamicParams = false;

export function generateStaticParams() {
  return articleStaticParams("money");
}

export async function generateMetadata({ params }: PageProps<"/money/[slug]">): Promise<Metadata> {
  return articleMetadata("money", (await params).slug);
}

export default async function Page({ params }: PageProps<"/money/[slug]">) {
  return <ArticlePage section="money" slug={(await params).slug} />;
}
