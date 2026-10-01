import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHub } from "@/components/pages/SectionHub";
import { sections, getTopic } from "@/data/taxonomy";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { getArticlesByTopic } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return sections["travel-tech"].topics.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/travel-tech/topics/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  const t = getTopic("travel-tech", topic);
  if (!t) return {};
  return buildMetadata({
    title: `${t.label} | ${sections["travel-tech"].label}`,
    description: `${t.description} Practical, sourced guides from Uncle Jetlag.`,
    path: routes.topic("travel-tech", topic),
    ogKicker: sections["travel-tech"].label,
    // Thin (empty) topic pages stay out of the index until they have content.
    noindex: getArticlesByTopic("travel-tech", topic).length === 0,
  });
}

export default async function Page({ params }: PageProps<"/travel-tech/topics/[topic]">) {
  const { topic } = await params;
  if (!getTopic("travel-tech", topic)) notFound();
  return <SectionHub section="travel-tech" topic={topic} />;
}
