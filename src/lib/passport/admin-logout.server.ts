/** Server-side Auth revocation. Tokens and provider errors must never be logged. */
export async function revokeResearchSession(
  token: string | null,
  config: { url: string; anonKey: string } | null,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!token) return true;
  if (!config?.url || !config.anonKey) return false;
  try {
    const origin = new URL(config.url);
    if (origin.protocol !== "https:" || origin.username || origin.password ||
        origin.pathname !== "/" || origin.search || origin.hash) return false;
    const response = await fetcher(new URL("/auth/v1/logout?scope=local", origin), {
      method: "POST",
      headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
