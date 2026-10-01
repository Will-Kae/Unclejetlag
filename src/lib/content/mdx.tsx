import "server-only";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import remarkAdSlots from "./remark-ad-slots";
import { mdxComponents } from "@/components/mdx";

/**
 * Compiles trusted MDX from /content at build time (all content routes are
 * statically generated). Do NOT pass untrusted user input to this function.
 */
export async function MdxContent({ source, ads = true }: { source: string; ads?: boolean }) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: ads ? [remarkGfm, remarkAdSlots] : [remarkGfm],
    rehypePlugins: [rehypeSlug],
  });
  return <Content components={mdxComponents} />;
}
