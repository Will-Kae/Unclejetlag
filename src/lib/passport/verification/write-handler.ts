import { NextRequest, NextResponse } from "next/server";
import { isVerificationEnabled } from "@/lib/passport/verification/server-config";
import { verifyPassportMutation } from "@/lib/passport/verification/mutation-auth";
import { toDatabaseFields, type PassportMutationKind } from "@/lib/passport/verification/mutation-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "Allow": "POST" };

export async function handlePassportWrite(
  request: NextRequest,
  kind: PassportMutationKind,
) {
  if (!isVerificationEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  }
  const auth = await verifyPassportMutation(
    request.headers.get("authorization"),
    kind === "review" ? ["reviewer", "admin"] : ["researcher", "admin"],
  );
  if (auth.status !== 200) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status, headers },
    );
  }
  // Fail closed until origin enforcement, distributed rate limiting, isolated
  // database integration tests, and migration verification have passed.
  if (process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED !== "true") {
    return NextResponse.json({ error: "Writes are not enabled" }, { status: 503, headers });
  }
  // Even if the flag is accidentally enabled, do not execute until the
  // production-grade protections and database tests are implemented.
  let body: unknown;
  try {
    if (Number(request.headers.get("content-length") || 0) > 16384) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413, headers });
    }
    body = await request.json();
    toDatabaseFields(kind, body);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers });
  }
  return NextResponse.json({ error: "Transactional integration not released" }, { status: 503, headers });
}
