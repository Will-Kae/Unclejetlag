import "server-only";
import { verificationConfig } from "./server-config";

export type PassportRole = "admin" | "researcher" | "reviewer";
export type PassportIdentity = { userId: string; role: PassportRole };

/**
 * Validate the caller's access token against Supabase Auth, then query
 * the database for an active role. Never trust browser-supplied user IDs,
 * roles, or user_metadata. Fail closed on every error.
 *
 * This is a server-only primitive; no route exposes it until CSRF,
 * session management and transactional mutations are implemented.
 */
export async function verifyPassportBearer(token: string): Promise<PassportIdentity | null> {
  if (!token || token.length > 8192) return null;
  try {
    const { url, key } = verificationConfig();
    const authResponse = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!authResponse.ok) return null;
    const user: unknown = await authResponse.json();
    if (!isUser(user)) return null;

    // This database query uses a server secret and must never be called
    // from the browser. The identity comes only from Supabase Auth.
    const roleResponse = await fetch(
      `${url}/rest/v1/passport_research_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,role,active&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!roleResponse.ok) return null;
    const rows: unknown = await roleResponse.json();
    if (!Array.isArray(rows) || rows.length !== 1) return null;
    const profile = rows[0];
    if (!isProfile(profile) || profile.user_id !== user.id || !profile.active) return null;
    return { userId: user.id, role: profile.role };
  } catch {
    return null;
  }
}

function isUser(value: unknown): value is { id: string } {
  return !!value && typeof value === "object"
    && "id" in value && typeof value.id === "string"
    && /^[0-9a-f-]{36}$/i.test(value.id);
}

function isProfile(value: unknown): value is { user_id: string; role: PassportRole; active: boolean } {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return typeof p.user_id === "string"
    && (p.role === "admin" || p.role === "researcher" || p.role === "reviewer")
    && typeof p.active === "boolean";
}
