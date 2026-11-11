/**
 * Session token validation shared by private API routes.
 * Never use this as authentication: Supabase Auth must verify the token.
 */
export function extractPassportBearer(authorization: string | null): string | null {
  if (!authorization || !authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  if (!token || token.length > 8192 || /\s/.test(token)) return null;
  return token;
}
