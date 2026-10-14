"use client";

import { useEffect, useState } from "react";
import { ReviewerDashboard, type ReviewerQueueRecord, type ReviewerSummary } from "./ReviewerDashboard";

type ReviewerResponse = {
  reviewerId: string;
  summary: ReviewerSummary;
  submissions: ReviewerQueueRecord[];
  truncated: boolean;
  summaryScope: "loaded_queue_only";
};

function isResponse(value: unknown): value is ReviewerResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (typeof data.reviewerId !== "string" || data.summaryScope !== "loaded_queue_only"
    || typeof data.truncated !== "boolean" || !Array.isArray(data.submissions)) return false;
  if (!data.summary || typeof data.summary !== "object") return false;
  const counts = data.summary as Record<string, unknown>;
  if (!["awaitingReview", "changesRequested", "reviewedByMe", "openConflicts"].every(
    (key) => Number.isSafeInteger(counts[key]) && Number(counts[key]) >= 0,
  )) return false;
  return data.submissions.every((row: unknown) => {
    if (!row || typeof row !== "object") return false;
    const record = row as Record<string, unknown>;
    return typeof record.id === "string" && typeof record.ruleId === "string"
      && typeof record.passportCode === "string" && typeof record.destinationCode === "string"
      && typeof record.submitterId === "string" && typeof record.sourceUrl === "string"
      && record.status === "submitted" && Number.isSafeInteger(record.revision)
      && Number(record.revision) > 0 && record.submitterId !== data.reviewerId;
  });
}

/**
 * Requires an access token supplied by a future authenticated session owner.
 * Never mount in a public route. No approval or rejection mutation is exposed.
 */
export function ReviewerDataPanel({ accessToken }: { accessToken: string | null }) {
  const [data, setData] = useState<ReviewerResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(null);
    setError("");
    if (!accessToken) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    void (async () => {
      try {
        const response = await fetch("/api/passport-verification/reviewer", {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Review queue unavailable");
        const payload: unknown = await response.json();
        if (!isResponse(payload)) throw new Error("Invalid review queue");
        if (!controller.signal.aborted) setData(payload);
      } catch {
        if (!controller.signal.aborted) setError("Unable to load the review queue. Please sign in again or retry.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [accessToken]);

  if (!accessToken) return <p role="status">Sign in to access the private reviewer workspace.</p>;
  if (loading) return <p role="status">Loading independent review queue…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">No review data loaded.</p>;
  return (
    <>
      {data.truncated && <p role="status">Showing up to 100 queue items. Counts are limited to loaded records.</p>}
      <ReviewerDashboard reviewerId={data.reviewerId} summary={data.summary} submissions={data.submissions} />
    </>
  );
}
