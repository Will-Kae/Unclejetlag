import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHub } from "@/components/pages/SectionHub";
import { sections, getTopic } from "@/data/taxonomy";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { getArticlesByTopic } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return sections["guides"].topics.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/topics/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  const t = getTopic("guides", topic);
  if (!t) return {};
  return buildMetadata({
    title: `${t.label} | ${sections["guides"].label}`,
    description: `${t.description} Practical, sourced guides from Uncle Jetlag.`,
    path: routes.topic("guides", topic),
    ogKicker: sections["guides"].label,
    // Thin (empty) topic pages stay out of the index until they have content.
    noindex: getArticlesByTopic("guides", topic).length === 0,
  });
}

export default async function Page({ params }: PageProps<"/guides/topics/[topic]">) {
  const { topic } = await params;
  if (!getTopic("guides", topic)) notFound();
  return <SectionHub section="guides" topic={topic} />;
}
