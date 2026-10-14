"use client";

import { useEffect, useState } from "react";
import { ResearcherDashboard, type ResearcherSubmission, type ResearcherSummary } from "./ResearcherDashboard";

type ResearcherData = {
  summary: ResearcherSummary;
  submissions: ResearcherSubmission[];
  truncated: boolean;
};

function isData(value: unknown): value is ResearcherData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.submissions) || typeof data.truncated !== "boolean") return false;
  const summary = data.summary;
  if (!summary || typeof summary !== "object") return false;
  const counts = summary as Record<string, unknown>;
  return ["drafts", "awaitingReview", "changesRequested", "approved"].every(
    (key) => Number.isSafeInteger(counts[key]) && Number(counts[key]) >= 0,
  ) && data.submissions.every((row: unknown) => {
    if (!row || typeof row !== "object") return false;
    const r = row as Record<string, unknown>;
    return typeof r.id === "string" && typeof r.ruleId === "string"
      && typeof r.passportCode === "string" && typeof r.destinationCode === "string"
      && ["draft", "submitted", "changes_requested", "approved", "rejected"].includes(String(r.status))
      && Number.isSafeInteger(r.revision);
  });
}

/**
 * Auth integration boundary: the parent must supply a short-lived Supabase
 * access token from a verified session. This component does not persist it,
 * log it, put it in a URL, or fetch until one is supplied.
 * Do not mount on the public site.
 */
export function ResearcherDataPanel({ accessToken }: { accessToken: string | null }) {
  const [data, setData] = useState<ResearcherData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(null);
    setError("");
    if (!accessToken) return;
    const controller = new AbortController();
    setLoading(true);
    void (async () => {
      try {
        const response = await fetch("/api/passport-verification/researcher", {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load your research records.");
        const payload: unknown = await response.json();
        if (!isData(payload)) throw new Error("Unexpected research response.");
        if (!controller.signal.aborted) setData(payload);
      } catch {
        if (!controller.signal.aborted) setError("Research records are unavailable. Please retry after signing in.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [accessToken]);

  if (!accessToken) return <p role="status">Sign in to access your private research workspace.</p>;
  if (loading) return <p role="status">Loading research records…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">No research data loaded.</p>;
  return (
    <>
      {data.truncated && <p role="status">Showing the most recent 100 records. Totals are limited to this page.</p>}
      <ResearcherDashboard summary={data.summary} submissions={data.submissions} />
    </>
  );
}
