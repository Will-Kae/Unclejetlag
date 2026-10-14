import "server-only";
import { cookies } from "next/headers";
import { verifyResearchSession } from "./admin-session.server";

export const RESEARCH_COOKIE = "uj_passport_research_session";

export function researchConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export async function currentResearchIdentity() {
  const config = researchConfig();
  if (!config) return null;
  const token = (await cookies()).get(RESEARCH_COOKIE)?.value ?? null;
  if (!token) return null;
  try {
    return await verifyResearchSession(token, config);
  } catch {
    return null;
  }
}
