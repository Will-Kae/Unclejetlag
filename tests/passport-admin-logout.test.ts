import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { revokeResearchSession } from "../src/lib/passport/admin-logout.server";

const state = vi.hoisted(() => ({
  token: "test-token" as string | null,
  config: { url: "https://example.supabase.co", anonKey: "public-key" } as
    { url: string; anonKey: string } | null,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => state.token ? { value: state.token } : undefined }),
}));
vi.mock("@/lib/passport/admin-auth.server", () => ({
  RESEARCH_COOKIE: "uj_passport_research_session",
  researchConfig: () => state.config,
}));
import { POST } from "../src/app/passport-index/research-admin/logout/route";

const config = { url: "https://example.supabase.co", anonKey: "public-key" };
const request = (origin: string | null = "https://app.example") =>
  new Request("https://app.example/passport-index/research-admin/logout", {
    method: "POST", headers: origin ? { origin } : {},
  });

beforeEach(() => {
  state.token = "test-token";
  state.config = config;
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("research Auth revocation", () => {
  it("posts the token to the current-session Auth endpoint without caching or redirects", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    expect(await revokeResearchSession("token", config, fetcher)).toBe(true);
    const [url, init] = fetcher.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe("https://example.supabase.co/auth/v1/logout?scope=local");
    expect(init).toMatchObject({
      method: "POST", cache: "no-store", redirect: "error",
      headers: { apikey: "public-key", Authorization: "Bearer token" },
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
  it("does not contact Auth when the browser has no token", async () => {
    const fetcher = vi.fn();
    expect(await revokeResearchSession(null, null, fetcher)).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not claim revocation on Auth errors or network failure", async () => {
    for (const status of [400, 401, 403, 500]) {
      const fetcher = vi.fn(async () => new Response(null, { status }));
      expect(await revokeResearchSession("token", config, fetcher)).toBe(false);
    }
    const fetcher = vi.fn(async () => { throw new Error("private provider failure"); });
    expect(await revokeResearchSession("token", config, fetcher)).toBe(false);
  });
  it("refuses missing or unsafe Auth configuration without sending the token", async () => {
    const fetcher = vi.fn();
    for (const url of ["http://example.supabase.co", "https://user:pass@example.supabase.co",
      "https://example.supabase.co/path", "https://example.supabase.co/?query=1", "https://example.supabase.co/#fragment"]) {
      expect(await revokeResearchSession("token", { ...config, url }, fetcher)).toBe(false);
    }
    expect(await revokeResearchSession("token", null, fetcher)).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("research logout route", () => {
  it("rejects missing or cross-site origins before Auth or cookie changes", async () => {
    for (const origin of [null, "https://other.example"]) {
      const response = await POST(request(origin));
      expect(response.status).toBe(403);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it("revokes Auth and expires the exact secure cookie before redirecting", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(request());
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://app.example/passport-index/research-admin/login");
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("uj_passport_research_session=");
    for (const fragment of ["Path=/passport-index/research-admin", "Max-Age=0", "HttpOnly", "Secure", "SameSite=strict"]) {
      expect(cookie).toContain(fragment);
    }
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("clears the cookie but reports unconfirmed revocation when Auth fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("PRIVATE_PROVIDER_DETAIL"); }));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    const text = await response.text();
    expect(text).toContain("revocation could not be confirmed");
    expect(text).not.toContain("PRIVATE_PROVIDER_DETAIL");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("redirects without an Auth request when already signed out", async () => {
    state.token = null;
    const response = await POST(request());
    expect(response.status).toBe(303);
    expect(fetch).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
  it("clears local cookie and reports failure for a token with missing Auth config", async () => {
    state.config = null;
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
