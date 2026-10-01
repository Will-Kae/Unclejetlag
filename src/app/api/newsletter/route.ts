import { NextResponse } from "next/server";
import { EMAIL_RE, getNewsletterProvider } from "@/lib/newsletter";

export async function POST(req: Request) {
  let body: { email?: unknown; source?: unknown; company?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // Honeypot: real people never fill the hidden "company" field.
  if (typeof body.company === "string" && body.company.length > 0) return NextResponse.json({ ok: true });

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const source = typeof body.source === "string" ? body.source.slice(0, 80) : "unknown";
  const result = await getNewsletterProvider().subscribe({ email, source, consentedAt: new Date().toISOString() });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, message: result.message });
}
