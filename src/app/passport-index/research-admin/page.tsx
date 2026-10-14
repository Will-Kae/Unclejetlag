import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyResearchSession } from "@/lib/passport/admin-session.server";

/**
 * Restricted read-only admin entry point.
 * Session transport is deliberately not implemented yet: a valid Supabase Auth
 * cookie cannot be safely inferred from arbitrary browser-controlled cookie names.
 * Until SSR Auth and RLS are integrated, this route is closed to everyone.
 */
export const dynamic = "force-dynamic";
export const metadata = { title: "Passport Research Admin | Uncle Jetlag", robots: { index: false, follow: false } };

export default async function PassportResearchAdminPage() {
  await cookies();
  // Do not use a service-role key or an unauthenticated fallback here.
  // Supabase SSR cookie/session integration is required before enabling access.
  void verifyResearchSession;
  redirect("/passport-index/evidence-review");
}
