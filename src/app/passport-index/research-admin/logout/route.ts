import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RESEARCH_COOKIE } from "@/lib/passport/admin-auth.server";

export async function POST(request: Request) {
  const jar = await cookies();
  jar.delete(RESEARCH_COOKIE);
  return NextResponse.redirect(new URL("/passport-index/research-admin/login", request.url), 303);
}
