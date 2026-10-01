import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHub } from "@/components/pages/SectionHub";
import { sections, getTopic } from "@/data/taxonomy";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { getArticlesByTopic } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return sections["money"].topics.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/money/topics/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  const t = getTopic("money", topic);
  if (!t) return {};
  return buildMetadata({
    title: `${t.label} | ${sections["money"].label}`,
    description: `${t.description} Practical, sourced guides from Uncle Jetlag.`,
    path: routes.topic("money", topic),
    ogKicker: sections["money"].label,
    // Thin (empty) topic pages stay out of the index until they have content.
    noindex: getArticlesByTopic("money", topic).length === 0,
  });
}

export default async function Page({ params }: PageProps<"/money/topics/[topic]">) {
  const { topic } = await params;
  if (!getTopic("money", topic)) notFound();
  return <SectionHub section="money" topic={topic} />;
}
