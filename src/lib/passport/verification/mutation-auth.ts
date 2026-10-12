import "server-only";
import { verifyPassportBearer, type PassportIdentity } from "./auth";
import { extractPassportBearer } from "./session-token";

/**
 * Server-only mutation identity boundary.
 *
 * The current backend uses PostgREST, which cannot invoke the private
 * passport_internal schema unless it is exposed. Do NOT expose that schema
 * or move privileged operations back into public to work around this.
 *
 * A future implementation must use a private DB connection or a dedicated
 * server-side worker, verify the bearer token with Supabase Auth, pass only
 * identity.userId as p_actor, and run the database transaction with a
 * tightly scoped credential. Never accept p_actor from request JSON.
 */
export async function verifyPassportMutation(
  authorization: string | null,
  roles: readonly PassportIdentity["role"][],
): Promise<
  | { status: 401; identity: null }
  | { status: 403; identity: null }
  | { status: 200; identity: PassportIdentity }
> {
  const token = extractPassportBearer(authorization);
  if (!token) return { status: 401, identity: null };
  const identity = await verifyPassportBearer(token);
  if (!identity) return { status: 401, identity: null };
  if (!roles.includes(identity.role)) return { status: 403, identity: null };
  return { status: 200, identity };
}
