import type { Metadata } from "next";
import { SectionHub } from "@/components/pages/SectionHub";
import { sections } from "@/data/taxonomy";
import { buildMetadata } from "@/lib/seo";

const s = sections["guides"];
export const metadata: Metadata = buildMetadata({ title: s.title, description: s.description, path: s.path, ogKicker: s.label });

export default function Page() {
  return <SectionHub section="guides" />;
}
