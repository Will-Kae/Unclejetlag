import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RESEARCH_COOKIE } from "@/lib/passport/admin-auth.server";

/** Reject cross-origin and origin-less logout POSTs to prevent forced sign-outs. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (!origin || origin !== expectedOrigin) {
    return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const jar = await cookies();
  jar.delete(RESEARCH_COOKIE);
  const response = NextResponse.redirect(new URL("/passport-index/research-admin/login", request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
