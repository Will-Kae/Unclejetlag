import "server-only";
import { mayPerform, type ResearchAction, type ResearchIdentity, type AuthorisationContext } from "./admin-permissions";

/**
 * Server-only Supabase Auth verification boundary.
 * A bearer token MUST come from a validated server session (not a browser-supplied user ID).
 * This function never grants privileges based on JWT claims or client-supplied roles.
 * This is an integration primitive, NOT a login route or a complete session implementation.
 */
export async function verifyResearchSession(
  accessToken: string | null,
  config: { url: string; anonKey: string },
  fetcher: typeof fetch = fetch,
): Promise<ResearchIdentity | null> {
  if (!accessToken || !config.url || !config.anonKey) return null;
  const origin = new URL(config.url);
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/") {
    throw new Error("Supabase URL must be a trusted HTTPS project origin");
  }
  const headers = { apikey: config.anonKey, Authorization: `Bearer ${accessToken}` };
  const userResponse = await fetcher(new URL("/auth/v1/user", origin), {
    headers, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!userResponse.ok) return null;
  const user = await userResponse.json() as { id?: unknown };
  if (typeof user.id !== "string" || !/^[0-9a-f-]{36}$/i.test(user.id)) return null;
  const url = new URL("/rest/v1/passport_research_profiles", origin);
  url.searchParams.set("select", "user_id,role,active");
  url.searchParams.set("user_id", `eq.${user.id}`);
  url.searchParams.set("limit", "1");
  const profileResponse = await fetcher(url, {
    headers, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!profileResponse.ok) return null;
  const rows = await profileResponse.json() as unknown;
  if (!Array.isArray(rows) || rows.length !== 1) return null;
  const profile = rows[0] as Record<string, unknown>;
  if (profile.user_id !== user.id || profile.active !== true ||
    !["admin", "reviewer", "researcher"].includes(String(profile.role))) return null;
  return { userId: user.id, active: true, role: profile.role as ResearchIdentity["role"] };
}

export async function requireResearchPermission(
  token: string | null,
  config: { url: string; anonKey: string },
  action: ResearchAction,
  context: AuthorisationContext = {},
  fetcher: typeof fetch = fetch,
): Promise<ResearchIdentity | null> {
  const identity = await verifyResearchSession(token, config, fetcher);
  return mayPerform(identity, action, context) ? identity : null;
}
