import type { Metadata } from "next";
import { ArticlePage, articleMetadata, articleStaticParams } from "@/components/pages/ArticlePage";

export const dynamicParams = false;

export function generateStaticParams() {
  return articleStaticParams("travel-tech");
}

export async function generateMetadata({ params }: PageProps<"/travel-tech/[slug]">): Promise<Metadata> {
  return articleMetadata("travel-tech", (await params).slug);
}

export default async function Page({ params }: PageProps<"/travel-tech/[slug]">) {
  return <ArticlePage section="travel-tech" slug={(await params).slug} />;
}
