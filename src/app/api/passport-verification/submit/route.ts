import { NextRequest } from "next/server";
import { handlePassportWrite } from "@/lib/passport/verification/write-handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handlePassportWrite(request, "submit");
}
