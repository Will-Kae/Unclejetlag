import { NextRequest, NextResponse } from "next/server";
import { isVerificationEnabled } from "@/lib/passport/verification/server-config";
import { verifyPassportMutation } from "@/lib/passport/verification/mutation-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "Allow": "POST" };

/**
 * Fail-closed placeholder: never perform writes before the private database
 * executor, CSRF/origin policy, rate limits and end-to-end tests are ready.
 * This endpoint is intentionally not a working submission API.
 */
export async function POST(request: NextRequest) {
  if (!isVerificationEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  }
  const auth = await verifyPassportMutation(
    request.headers.get("authorization"),
    ["researcher", "admin"],
  );
  if (auth.status !== 200) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status, headers },
    );
  }
  return NextResponse.json(
    { error: "Submission writes are not enabled" },
    { status: 503, headers },
  );
}
