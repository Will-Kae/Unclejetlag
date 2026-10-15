import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { RESEARCH_COOKIE, researchConfig } from "@/lib/passport/admin-auth.server";
import { verifyResearchSession } from "@/lib/passport/admin-session.server";

export async function signInResearch(form: FormData) {
  "use server";
  const config = researchConfig();
  // Reject cross-site form submissions before contacting the identity provider.
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  if (!origin || !host || !["http", "https"].includes(protocol) || origin !== `${protocol}://${host}`) {
    redirect("/passport-index/research-admin/login?error=credentials");
  }
  if (!config) redirect("/passport-index/research-admin/login?error=config");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password || email.length > 254 || password.length > 1024) {
    redirect("/passport-index/research-admin/login?error=credentials");
  }
  let token: string | null = null;
  try {
    const response = await fetch(new URL("/auth/v1/token?grant_type=password", config.url), {
      method: "POST", cache: "no-store",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) {
      const data = await response.json() as { access_token?: string };
      token = data.access_token ?? null;
    }
    if (!await verifyResearchSession(token, config)) token = null;
  } catch {
    token = null;
  }
  if (!token) redirect("/passport-index/research-admin/login?error=credentials");
  (await cookies()).set(RESEARCH_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", path: "/passport-index/research-admin", maxAge: 3600,
  });
  redirect("/passport-index/research-admin");
}
