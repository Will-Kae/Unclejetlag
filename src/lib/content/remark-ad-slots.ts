/**
 * Remark plugin: auto-inserts <AdSlot position="after-intro"/> before the first H2
 * and <AdSlot position="mid-article"/> before the middle H2 (articles with ≥4 H2s).
 * Authors can opt out by placing <AdSlot/> manually or setting `noAds` frontmatter.
 * AdSlot renders nothing unless ads are configured AND consented, so this is free
 * when ads are off.
 */
type Node = { type: string; depth?: number; name?: string; children?: Node[]; attributes?: unknown[] };

const slot = (position: string): Node => ({
  type: "mdxJsxFlowElement",
  name: "AdSlot",
  attributes: [{ type: "mdxJsxAttribute", name: "position", value: position }],
  children: [],
});

export default function remarkAdSlots() {
  return (tree: Node) => {
    const children = tree.children ?? [];
    if (children.some((n) => n.type === "mdxJsxFlowElement" && n.name === "AdSlot")) return;
    const h2 = children.map((n, i) => (n.type === "heading" && n.depth === 2 ? i : -1)).filter((i) => i >= 0);
    if (h2.length === 0) return;
    const inserts: [number, string][] = [[h2[0], "after-intro"]];
    if (h2.length >= 4) inserts.push([h2[Math.floor(h2.length / 2)], "mid-article"]);
    for (const [idx, pos] of inserts.sort((a, b) => b[0] - a[0])) children.splice(idx, 0, slot(pos));
  };
}
