import { NextResponse } from "next/server";
import { RESEARCH_COOKIE } from "@/lib/passport/admin-auth.server";

/** Reject cross-origin and origin-less logout POSTs to prevent forced sign-outs. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (!origin || origin !== expectedOrigin) {
    return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const response = NextResponse.redirect(new URL("/passport-index/research-admin/login", request.url), 303);
  // Expire the cookie at the exact path used during sign-in. Deleting at "/" leaves it intact.
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
