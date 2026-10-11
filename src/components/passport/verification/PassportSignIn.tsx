"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AuthenticatedWorkspace } from "./AuthenticatedWorkspace";

type AuthSession = { access_token: string; expires_in: number };
const MAX_TOKEN_LENGTH = 8192;

function publicAuthConfig(): { origin: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") return null;
    return { origin: parsed.origin, key };
  } catch { return null; }
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return typeof data.access_token === "string" && data.access_token.length > 0
    && data.access_token.length <= MAX_TOKEN_LENGTH && !/\s/.test(data.access_token)
    && typeof data.expires_in === "number" && Number.isFinite(data.expires_in)
    && data.expires_in > 0;
}

/**
 * Invite-only Supabase password sign-in; no registration or browser persistence.
 * Users must already exist in Supabase Auth with an active research profile.
 * Session is deliberately discarded on refresh and on token expiry.
 */
export function PassportSignIn() {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const config = publicAuthConfig();

  useEffect(() => {
    if (!token) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      setToken(null);
      return;
    }
    const timeout = setTimeout(() => {
      setToken(null);
      setMessage("Session expired. Please sign in again.");
    }, remaining);
    return () => clearTimeout(timeout);
  }, [token, expiresAt]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config || busy) return;
    setBusy(true);
    setMessage("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${config.origin}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: config.key, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Sign-in failed");
      const payload: unknown = await response.json();
      if (!isAuthSession(payload)) throw new Error("Invalid auth response");
      // Confirm the active database role before granting dashboard access.
      const check = await fetch("/api/passport-verification/me", {
        headers: { Authorization: `Bearer ${payload.access_token}` },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!check.ok) throw new Error("Not authorized");
      const identity: unknown = await check.json();
      if (!identity || typeof identity !== "object" ||
        !["admin", "researcher", "reviewer"].includes(String((identity as Record<string, unknown>).role))) {
        throw new Error("Invalid role");
      }
      setToken(payload.access_token);
      setExpiresAt(Date.now() + Math.min(payload.expires_in * 1000, 3600000));
    } catch {
      setToken(null);
      setMessage("Sign-in unavailable or account not authorized.");
    } finally {
      clearTimeout(timeout);
      setPassword("");
      setBusy(false);
    }
  }

  if (!config) return <p role="status">Private authentication is not configured.</p>;
  if (token) return (
    <section aria-label="Authorized passport workspace">
      <button type="button" onClick={() => { setToken(null); setPassword(""); setMessage(""); }}>Sign out</button>
      <AuthenticatedWorkspace accessToken={token} />
    </section>
  );
  return (
    <form onSubmit={signIn} aria-label="Passport verification sign-in">
      <h1>Passport verification sign-in</h1>
      <p>Authorized researchers, reviewers and administrators only. No public registration.</p>
      <label htmlFor="passport-auth-email">Email</label>
      <input id="passport-auth-email" type="email" autoComplete="username" required maxLength={254}
        value={email} onChange={(event) => setEmail(event.target.value)} />
      <label htmlFor="passport-auth-password">Password</label>
      <input id="passport-auth-password" type="password" autoComplete="current-password" required
        value={password} onChange={(event) => setPassword(event.target.value)} />
      <button type="submit" disabled={busy}>{busy ? "Verifying…" : "Sign in"}</button>
      {message && <p role="alert">{message}</p>}
    </form>
  );
}
