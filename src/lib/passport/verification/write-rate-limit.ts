import "server-only";
import { verificationConfig } from "./server-config";

export type PassportWriteOperation = "submit" | "review" | "resubmit";

/**
 * Atomic shared counter in Postgres, not an in-memory Vercel instance counter.
 * Deny on any database error or missing configuration.
 */
export async function checkPassportWriteRateLimit(
  actorId: string,
  operation: PassportWriteOperation,
): Promise<"allowed" | "limited" | "unavailable"> {
  try {
    const { url, key } = verificationConfig();
    const response = await fetch(`${url}/rest/v1/rpc/passport_server_rate_limit`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_actor: actorId, p_operation: operation }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "unavailable";
    const value: unknown = await response.json();
    if (value === true) return "allowed";
    if (value === false) return "limited";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}
