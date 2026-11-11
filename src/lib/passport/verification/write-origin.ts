/**
 * Mutating passport requests must originate from an explicitly configured
 * trusted HTTPS site. Never trust Host or X-Forwarded-Host as the allowlist.
 * Requests without Origin are rejected (including CLI callers).
 */
export function allowedPassportWriteOrigin(
  originHeader: string | null,
  configuredOrigins: string | undefined,
): boolean {
  if (!originHeader || !configuredOrigins) return false;
  try {
    const actual = new URL(originHeader);
    if (actual.origin !== originHeader || actual.username || actual.password) return false;
    const allow = configuredOrigins.split(",").map((s) => s.trim()).filter(Boolean);
    return allow.some((value) => {
      try {
        const expected = new URL(value);
        return expected.origin === value
          && (expected.protocol === "https:" || (process.env.NODE_ENV !== "production" && expected.hostname === "localhost"))
          && actual.origin === expected.origin;
      } catch { return false; }
    });
  } catch { return false; }
}
