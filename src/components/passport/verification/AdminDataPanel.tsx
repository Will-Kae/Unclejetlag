"use client";

import { useEffect, useState } from "react";
import { AdminDashboard } from "./AdminDashboard";
import { adaptAdminResponse, type AdminApiResponse } from "./admin-adapter";

function isResponse(value: unknown): value is AdminApiResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (!data.summary || typeof data.summary !== "object"
    || !Array.isArray(data.releases) || !Array.isArray(data.audit)
    || typeof data.partial !== "boolean") return false;
  const summary = data.summary as Record<string, unknown>;
  if (!["activeResearchers", "activeReviewers", "pendingEvidence", "openConflicts", "releaseCandidates"]
    .every((key) => Number.isSafeInteger(summary[key]) && Number(summary[key]) >= 0)) return false;
  if (!data.releases.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    return typeof row.id === "string" && typeof row.label === "string"
      && ["draft", "ready_for_pr", "withdrawn"].includes(String(row.status))
      && row.evidenceCount === null;
  })) return false;
  return data.audit.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    return typeof row.id === "string" && typeof row.eventType === "string"
      && typeof row.occurredAt === "string";
  });
}

/** Requires a token from a future authenticated session provider. No mutations. */
export function AdminDataPanel({ accessToken }: { accessToken: string | null }) {
  const [data, setData] = useState<AdminApiResponse | null>(null);
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
        const response = await fetch("/api/passport-verification/admin", {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Admin data unavailable");
        const payload: unknown = await response.json();
        if (!isResponse(payload)) throw new Error("Unexpected admin response");
        if (!controller.signal.aborted) setData(payload);
      } catch {
        if (!controller.signal.aborted) setError("Unable to load administration records. Please sign in again or retry.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [accessToken]);

  if (!accessToken) return <p role="status">Sign in to access the private admin workspace.</p>;
  if (loading) return <p role="status">Loading administration records…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">No administration data loaded.</p>;
  const adapted = adaptAdminResponse(data);
  return (
    <>
      {adapted.partial && <p role="status">Some records exceed the API limit. Counts are incomplete.</p>}
      <AdminDashboard summary={adapted.summary} releases={adapted.releases} audit={adapted.audit} />
    </>
  );
}
