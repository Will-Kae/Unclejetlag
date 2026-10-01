import type { Metadata } from "next";
import { ArticlePage, articleMetadata, articleStaticParams } from "@/components/pages/ArticlePage";

export const dynamicParams = false;

export function generateStaticParams() {
  return articleStaticParams("guides");
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  return articleMetadata("guides", (await params).slug);
}

export default async function Page({ params }: PageProps<"/guides/[slug]">) {
  return <ArticlePage section="guides" slug={(await params).slug} />;
}
