import { NextRequest, NextResponse } from "next/server";
import { isVerificationEnabled } from "@/lib/passport/verification/server-config";
import { verifyPassportMutation } from "@/lib/passport/verification/mutation-auth";
import { toDatabaseFields, type PassportMutationKind } from "@/lib/passport/verification/mutation-validation";
import { allowedPassportWriteOrigin } from "@/lib/passport/verification/write-origin";
import { checkPassportWriteRateLimit } from "@/lib/passport/verification/write-rate-limit";
import { executePassportMutation } from "@/lib/passport/verification/mutation-executor";

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
  if (!allowedPassportWriteOrigin(request.headers.get("origin"), process.env.PASSPORT_WRITE_ALLOWED_ORIGINS)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403, headers });
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
  const limit = await checkPassportWriteRateLimit(auth.identity.userId, kind);
  if (limit === "limited") {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { ...headers, "Retry-After": "60" } });
  }
  if (limit === "unavailable") {
    return NextResponse.json({ error: "Rate limiter unavailable" }, { status: 503, headers });
  }
  // Even if the flag is accidentally enabled, do not execute until the
  // production-grade protections and database tests are implemented.
  let fields: ReturnType<typeof toDatabaseFields>;
  try {
    if (Number(request.headers.get("content-length") || 0) > 16384) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413, headers });
    }
    const body: unknown = await request.json();
    fields = toDatabaseFields(kind, body);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers });
  }
  // A second independent opt-in is required to exercise the RPC bridge.
  // Neither flag is enabled in production. Do not enable until deployment review.
  if (process.env.PASSPORT_WRITE_RPC_BRIDGE_ENABLED !== "true") {
    return NextResponse.json({ error: "Transactional integration not released" }, { status: 503, headers });
  }
  try {
    const result = await executePassportMutation(kind, auth.identity.userId, fields);
    return NextResponse.json({ result }, { status: kind === "submit" ? 201 : 200, headers });
  } catch {
    // Never disclose database error messages or credentials to callers.
    return NextResponse.json({ error: "Passport transaction unavailable or rejected" }, { status: 503, headers });
  }
}
