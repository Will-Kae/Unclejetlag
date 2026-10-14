import type { CoverageReport } from "./coverage";

/** Deterministic review queue. All dates are dataset dates, never the server clock. */
export type ReviewTask = {
  id: string;
  kind: "conflict" | "source-overdue" | "source-upcoming" | "pending-pair";
  priority: "critical" | "high" | "normal";
  label: string;
  dueOn: string | null;
  sourceIds: string[];
};

function validDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date;
}

/** No external fetches or automated claims about immigration rules. */
export function buildReviewQueue(
  report: Pick<CoverageReport, "dataset" | "sources" | "conflicts" | "pairs">,
  upcomingDays = 30,
): ReviewTask[] {
  if (!validDate(report.dataset.asOf)) throw new RangeError("Invalid dataset asOf date");
  if (!Number.isInteger(upcomingDays) || upcomingDays < 0 || upcomingDays > 365) {
    throw new RangeError("upcomingDays must be an integer between 0 and 365");
  }
  const asOf = report.dataset.asOf;
  const horizon = new Date(Date.parse(asOf) + upcomingDays * 86400000).toISOString().slice(0, 10);
  const tasks: ReviewTask[] = [];
  for (const conflict of report.conflicts) {
    tasks.push({
      id: `conflict:${conflict.pair}`, kind: "conflict", priority: "critical",
      label: `Resolve conflicting official evidence for ${conflict.pair}`,
      dueOn: null, sourceIds: [],
    });
  }
  for (const source of report.sources) {
    if (!validDate(source.reviewDueOn)) throw new RangeError(`Invalid review date for ${source.id}`);
    if (source.reviewDueOn > horizon) continue;
    const overdue = source.reviewDueOn < asOf;
    tasks.push({
      id: `source:${source.id}`, kind: overdue ? "source-overdue" : "source-upcoming",
      priority: overdue ? "high" : "normal",
      label: `Recheck official source ${source.id}`,
      dueOn: source.reviewDueOn, sourceIds: [source.id],
    });
  }
  for (const pair of report.pairs) {
    if (pair.status !== "pending" && pair.status !== "disputed") continue;
    // A conflict already has a dedicated critical task.
    if (pair.status === "disputed" && report.conflicts.some((c) => c.pair === `${pair.passport}>${pair.destination}`)) continue;
    tasks.push({
      id: `pair:${pair.passport}>${pair.destination}`,
      kind: "pending-pair", priority: pair.status === "disputed" ? "critical" : "normal",
      label: `Verify evidence for ${pair.passport} → ${pair.destination} (${pair.status})`,
      dueOn: null, sourceIds: pair.sourceIds,
    });
  }
  const rank = { critical: 0, high: 1, normal: 2 };
  return tasks.sort((a, b) => rank[a.priority] - rank[b.priority] ||
    (a.dueOn ?? "9999-12-31").localeCompare(b.dueOn ?? "9999-12-31") || a.id.localeCompare(b.id));
}
