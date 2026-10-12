import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  enabled: vi.fn(() => true),
  auth: vi.fn(),
  rate: vi.fn(),
  origin: vi.fn(() => true),
}));

vi.mock("../../src/lib/passport/verification/server-config", () => ({
  isVerificationEnabled: mocks.enabled,
}));
vi.mock("../../src/lib/passport/verification/mutation-auth", () => ({
  verifyPassportMutation: mocks.auth,
}));
vi.mock("../../src/lib/passport/verification/write-rate-limit", () => ({
  checkPassportWriteRateLimit: mocks.rate,
}));
vi.mock("../../src/lib/passport/verification/write-origin", () => ({
  allowedPassportWriteOrigin: mocks.origin,
}));

import { handlePassportWrite } from "../../src/lib/passport/verification/write-handler";

const good = {
  sourceId: "government", sourceUrl: "https://example.gov/visas",
  observedAt: "2026-10-12T12:00:00Z",
  rationale: "Official immigration authority publication independently verified.",
  aiAssisted: false,
  ruleId: "rule-1", passportCode: "AUS", destinationCode: "ZAF",
  access: "visa_free",
};
function req(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://unclejetlag.com/api/passport-verification/submit", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://unclejetlag.com", authorization: "Bearer sample", ...headers },
    body: JSON.stringify(body),
  });
}

describe("passport write HTTP boundary (no real database or credentials)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.enabled.mockReturnValue(true);
    mocks.origin.mockReturnValue(true);
    mocks.auth.mockResolvedValue({ status: 200, identity: { userId: "00000000-0000-4000-8000-000000000001", role: "researcher" } });
    mocks.rate.mockResolvedValue("allowed");
    process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = "false";
  });
  it("404 when workspace is off", async () => {
    mocks.enabled.mockReturnValue(false);
    const res = await handlePassportWrite(req(good), "submit");
    expect(res.status).toBe(404);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it("rejects untrusted origin before authorization", async () => {
    mocks.origin.mockReturnValue(false);
    const res = await handlePassportWrite(req(good), "submit");
    expect(res.status).toBe(403);
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it("rejects missing/invalid bearer and inactive role", async () => {
    mocks.auth.mockResolvedValueOnce({ status: 401, identity: null }).mockResolvedValueOnce({ status: 403, identity: null });
    expect((await handlePassportWrite(req(good), "submit")).status).toBe(401);
    expect((await handlePassportWrite(req(good), "submit")).status).toBe(403);
    expect(mocks.rate).not.toHaveBeenCalled();
  });
  it("uses reviewer role requirement only for review", async () => {
    await handlePassportWrite(req(good), "review");
    expect(mocks.auth).toHaveBeenCalledWith("Bearer sample", ["reviewer", "admin"]);
  });
  it("stays fail closed when write flag is off", async () => {
    const res = await handlePassportWrite(req(good), "submit");
    expect(res.status).toBe(503);
    expect(mocks.rate).not.toHaveBeenCalled();
  });
  it("returns 429 with Retry-After on rate limit", async () => {
    process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = "true";
    mocks.rate.mockResolvedValue("limited");
    const res = await handlePassportWrite(req(good), "submit");
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60");
  });
  it("fails closed when rate-limit database is unavailable", async () => {
    process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = "true";
    mocks.rate.mockResolvedValue("unavailable");
    expect((await handlePassportWrite(req(good), "submit")).status).toBe(503);
  });
  it("rejects caller-provided actor, oversized payload and malformed input", async () => {
    process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = "true";
    expect((await handlePassportWrite(req({ ...good, p_actor: "admin" }), "submit")).status).toBe(400);
    expect((await handlePassportWrite(req(good, { "content-length": "16385" }), "submit")).status).toBe(413);
    expect((await handlePassportWrite(req({ ...good, sourceUrl: "http://evil.test" }), "submit")).status).toBe(400);
  });
  it("does not execute mutations even if write flag is enabled", async () => {
    process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = "true";
    const res = await handlePassportWrite(req(good), "submit");
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("Transactional integration not released");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});
