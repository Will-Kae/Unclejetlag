import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { RESEARCH_COOKIE, researchConfig } from "@/lib/passport/admin-auth.server";
import { revokeResearchSession } from "@/lib/passport/admin-logout.server";

/** Reject cross-origin and origin-less logout POSTs to prevent forced sign-outs. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // Next may supply an internal render-server authority in request.url.
  // Compare against Host, never an Origin-derived or forwarded-host authority.
  const requestUrl = new URL(request.url);
  const host = request.headers.get("host") ?? requestUrl.host;
  if (!/^[a-zA-Z0-9.[\]:-]+$/.test(host)) {
    return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const expectedOrigin = requestUrl.protocol + "//" + host;
  if (!origin || origin !== expectedOrigin) {
    return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const token = (await cookies()).get(RESEARCH_COOKIE)?.value ?? null;
  const revoked = await revokeResearchSession(token, researchConfig());
  const response = revoked
    ? NextResponse.redirect(new URL("/passport-index/research-admin/login", expectedOrigin), 303)
    : new NextResponse(
        "Signed out on this browser. Server session revocation could not be confirmed.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
  // Clear the browser cookie even when Auth is unavailable. A 503 explicitly
  // distinguishes local sign-out from confirmed server-session revocation.
  response.cookies.set(RESEARCH_COOKIE, "", {
    path: "/passport-index/research-admin",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    expires: new Date(0),
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
