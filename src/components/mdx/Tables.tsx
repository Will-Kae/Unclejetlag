import { cn } from "@/lib/utils";

/** Wraps markdown (GFM) tables so they scroll horizontally on small screens. */
export function ScrollTable(props: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="not-prose my-8 overflow-hidden rounded-2xl ring-1 ring-line">
      <div className="overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label="Scrollable table">
        <table {...props} className={cn("table-uj", props.className)} />
      </div>
    </div>
  );
}

/**
 * Reusable comparison table for products, cards, eSIMs, etc.
 * Usage in MDX:
 * <ComparisonTable caption="…" columns={["Option", "Fees", "Best for"]} rows={[["A", "…", "…"]]} highlight={0} />
 */
export function ComparisonTable({
  caption,
  columns,
  rows,
  highlight,
  note,
}: {
  caption?: string;
  columns: string[];
  rows: React.ReactNode[][];
  highlight?: number;
  note?: string;
}) {
  return (
    <figure className="not-prose my-9">
      {caption && <figcaption className="mb-3 font-display text-lg font-semibold text-ink">{caption}</figcaption>}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <div className="overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label={caption ?? "Comparison table"}>
          <table className="table-uj">
            <thead>
              <tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={cn(highlight === i && "[&>td]:!bg-jet-soft/60")}>
                  {r.map((cell, j) =>
                    j === 0 ? (
                      <th key={j} scope="row" className={cn(highlight === i && "!bg-jet-soft")}>
                        {cell}
                        {highlight === i && <span className="label-mono mt-1 block !text-[0.6rem] text-jet-ink">★ Uncle&apos;s pick</span>}
                      </th>
                    ) : (
                      <td key={j}>{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
    </figure>
  );
}
