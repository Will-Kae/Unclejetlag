import { describe, expect, it, vi } from "vitest";
import { verifyResearchSession, requireResearchPermission } from "../src/lib/passport/admin-session.server";

const id = "11111111-1111-4111-8111-111111111111";
const config = { url: "https://example.supabase.co", anonKey: "public-anon-key" };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const mock = (role = "reviewer", active = true) => vi.fn(async (url: URL | RequestInfo) => {
  const path = String(url);
  if (path.includes("/auth/v1/user")) return response({ id });
  return response([{ user_id: id, role, active }]);
}) as unknown as typeof fetch;

describe("Supabase research session boundary", () => {
  it("denies missing access token", async () => {
    const fetcher = mock();
    expect(await verifyResearchSession(null, config, fetcher)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("reads roles from the database, not user claims", async () => {
    expect(await verifyResearchSession("token", config, mock())).toEqual({ userId: id, role: "reviewer", active: true });
    expect(await verifyResearchSession("token", config, mock("admin", false))).toBeNull();
    expect(await verifyResearchSession("token", config, mock("owner"))).toBeNull();
  });
  it("denies invalid tokens and profile fetch failures", async () => {
    const badToken = vi.fn(async () => response({}, 401)) as unknown as typeof fetch;
    expect(await verifyResearchSession("bad", config, badToken)).toBeNull();
    const noProfile = vi.fn(async (url: URL | RequestInfo) => String(url).includes("/auth/v1/user") ? response({ id }) : response([], 200)) as unknown as typeof fetch;
    expect(await verifyResearchSession("token", config, noProfile)).toBeNull();
  });
  it("enforces independent review after authentication", async () => {
    expect(await requireResearchPermission("token", config, "review-submission", { submissionOwnerId: id, submissionStatus: "submitted" }, mock())).toBeNull();
    expect(await requireResearchPermission("token", config, "review-submission", { submissionOwnerId: "someone-else", submissionStatus: "submitted" }, mock())).not.toBeNull();
  });
  it("rejects expired, revoked, or malformed access tokens", async () => {
    for (const status of [400, 401, 403]) {
      const fetcher = vi.fn(async () => response({ message: "invalid session" }, status)) as unknown as typeof fetch;
      expect(await verifyResearchSession("expired-or-revoked", config, fetcher)).toBeNull();
    }
    const invalidUser = vi.fn(async () => response({ id: "not-a-uuid" })) as unknown as typeof fetch;
    expect(await verifyResearchSession("token", config, invalidUser)).toBeNull();
  });
  it("denies missing, inactive, or mismatched research profiles", async () => {
    const cases = [[], [{ user_id: id, role: "researcher", active: false }], [{ user_id: "22222222-2222-4222-8222-222222222222", role: "admin", active: true }]];
    for (const profiles of cases) {
      const fetcher = vi.fn(async (url: URL | RequestInfo) =>
        String(url).includes("/auth/v1/user") ? response({ id }) : response(profiles)) as unknown as typeof fetch;
      expect(await verifyResearchSession("token", config, fetcher)).toBeNull();
    }
  });
  it("re-reads the current database role on each verification", async () => {
    expect(await requireResearchPermission("token", config, "prepare-release", {}, mock("admin"))).not.toBeNull();
    expect(await requireResearchPermission("token", config, "prepare-release", {}, mock("researcher"))).toBeNull();
    expect(await requireResearchPermission("token", config, "prepare-release", {}, mock("admin", false))).toBeNull();
  });
  it("fails closed when a verified user has no research profile or a forbidden profile lookup", async () => {
    for (const status of [401, 403, 500]) {
      const fetcher = vi.fn(async (url: URL | RequestInfo) =>
        String(url).includes("/auth/v1/user") ? response({ id }) : response({ error: "denied" }, status)) as unknown as typeof fetch;
      expect(await verifyResearchSession("token", config, fetcher)).toBeNull();
    }
  });
  it("fails closed on ambiguous duplicate research profiles", async () => {
    const fetcher = vi.fn(async (url: URL | RequestInfo) =>
      String(url).includes("/auth/v1/user") ? response({ id }) : response([
        { user_id: id, role: "admin", active: true },
        { user_id: id, role: "researcher", active: true },
      ])) as unknown as typeof fetch;
    expect(await verifyResearchSession("token", config, fetcher)).toBeNull();
  });
  it("keeps reviewer, researcher and inactive profiles out of release preparation", async () => {
    for (const role of ["researcher", "reviewer"]) {
      expect(await requireResearchPermission("token", config, "prepare-release", {}, mock(role))).toBeNull();
    }
    expect(await requireResearchPermission("token", config, "prepare-release", {}, mock("admin", false))).toBeNull();
    expect(await requireResearchPermission("token", config, "prepare-release", {}, mock("admin"))).not.toBeNull();
  });
  it("rejects untrusted Supabase URL configuration", async () => {
    await expect(verifyResearchSession("token", { ...config, url: "http://example.supabase.co" }, mock())).rejects.toThrow();
  });
});
