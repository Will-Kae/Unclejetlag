"use client";

import { useEffect, useState } from "react";
import { ResearcherDataPanel } from "./ResearcherDataPanel";
import { ReviewerDataPanel } from "./ReviewerDataPanel";
import { AdminDataPanel } from "./AdminDataPanel";

type Role = "researcher" | "reviewer" | "admin";

function isIdentity(value: unknown): value is { role: Role } {
  if (!value || typeof value !== "object") return false;
  const role = (value as Record<string, unknown>).role;
  return role === "researcher" || role === "reviewer" || role === "admin";
}

/**
 * Private role selector for an access token supplied by a trusted auth
 * session owner. No token is persisted, logged, placed in a URL or rendered.
 * This is not a sign-in form and is not mounted on a public route.
 */
export function AuthenticatedWorkspace({ accessToken }: { accessToken: string | null }) {
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(null);
    setError("");
    if (!accessToken) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    void (async () => {
      try {
        const response = await fetch("/api/passport-verification/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Identity check failed");
        const payload: unknown = await response.json();
        if (!isIdentity(payload)) throw new Error("Invalid identity response");
        if (!controller.signal.aborted) setRole(payload.role);
      } catch {
        if (!controller.signal.aborted) setError("Your verification session could not be authorized.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [accessToken]);

  if (!accessToken) return <p role="status">An authenticated session is required.</p>;
  if (loading) return <p role="status">Verifying workspace access…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!role) return <p role="status">No authorized workspace available.</p>;

  if (role === "admin") return <AdminDataPanel accessToken={accessToken} />;
  if (role === "reviewer") return <ReviewerDataPanel accessToken={accessToken} />;
  return <ResearcherDataPanel accessToken={accessToken} />;
}
