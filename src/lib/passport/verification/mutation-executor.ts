import "server-only";
import { verificationConfig } from "./server-config";

type Operation = "submit" | "review" | "resubmit";

/**
 * Server-side only PostgREST bridge. Each RPC is SECURITY INVOKER and grants
 * EXECUTE solely to service_role. Never accept the actor from request JSON.
 *
 * Hard-disabled until disposable DB migration tests, origin checks and rate
 * limiting are complete. The deployment environment must explicitly opt in.
 */
export async function executePassportMutation(
  operation: Operation,
  verifiedActorId: string,
  fields: Record<string, string | number | boolean | null>,
): Promise<unknown> {
  if (process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED !== "true") {
    throw new Error("Passport transactional writes are disabled");
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(verifiedActorId)) {
    throw new Error("Invalid verified identity");
  }
  const { url, key } = verificationConfig();
  const names: Record<Operation, string> = {
    submit: "passport_server_submit",
    review: "passport_server_review",
    resubmit: "passport_server_resubmit",
  };
  const response = await fetch(`${url}/rest/v1/rpc/${names[operation]}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({ ...fields, p_actor: verifiedActorId }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Passport transaction rejected");
  const text = await response.text();
  return text ? JSON.parse(text) as unknown : null;
}
