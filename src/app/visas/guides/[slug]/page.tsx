import type { Metadata } from "next";
import { ArticlePage, articleMetadata, articleStaticParams } from "@/components/pages/ArticlePage";

export const dynamicParams = false;

export function generateStaticParams() {
  return articleStaticParams("visas");
}

export async function generateMetadata({ params }: PageProps<"/visas/guides/[slug]">): Promise<Metadata> {
  return articleMetadata("visas", (await params).slug);
}

export default async function Page({ params }: PageProps<"/visas/guides/[slug]">) {
  return <ArticlePage section="visas" slug={(await params).slug} />;
}
