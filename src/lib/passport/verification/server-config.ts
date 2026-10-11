import "server-only";

/**
 * Private verification workspace. All requests must pass a trusted
 * server-side identity check; never expose service-role credentials.
 */
export function verificationConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Passport verification backend is not configured");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Supabase URL must be HTTPS");
  return { url: parsed.origin, key };
}

export function isVerificationEnabled() {
  return process.env.PASSPORT_VERIFICATION_WORKSPACE_ENABLED === "true";
}
