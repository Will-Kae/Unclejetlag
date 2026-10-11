import { NextRequest, NextResponse } from "next/server";
import { verifyPassportBearer } from "@/lib/passport/verification/auth";
import { isVerificationEnabled } from "@/lib/passport/verification/server-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Private identity probe only. No research data is returned.
 * Disabled until invite-only authentication and session management are tested.
 */
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!isVerificationEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  const token = authorization.slice(7);
  if (!token || token.includes(" ") || token.length > 8192) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  const identity = await verifyPassportBearer(token);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  return NextResponse.json({ role: identity.role }, { status: 200, headers });
}
