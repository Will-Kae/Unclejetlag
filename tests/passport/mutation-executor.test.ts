import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("../../src/lib/passport/verification/server-config", () => ({
  verificationConfig: () => ({ url: "https://passport-ci.supabase.co", key: "CI_ONLY_SECRET" }),
}));

import { executePassportMutation } from "../../src/lib/passport/verification/mutation-executor";

const actor = "00000000-0000-4000-8000-000000000001";
describe("passport server RPC transport contract", () => {
  const original = process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED;
  beforeEach(() => { vi.restoreAllMocks(); process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = "false"; });
  afterEach(() => { if (original === undefined) delete process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED; else process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = original; });
  it("never contacts the database with the flag disabled", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(executePassportMutation("submit", actor, {})).rejects.toThrow("disabled");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects unverified actor IDs before making a request", async () => {
    process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = "true";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(executePassportMutation("review", "attacker", {})).rejects.toThrow("Invalid verified identity");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(["submit", "review", "resubmit"] as const)("uses only server RPC and overwrites caller actor for %s", async (operation) => {
    process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = "true";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("null", { status: 200 }));
    await executePassportMutation(operation, actor, { p_actor: "attacker", p_revision: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://passport-ci.supabase.co/rest/v1/rpc/passport_server_${operation}`);
    expect(options?.method).toBe("POST");
    expect(options?.cache).toBe("no-store");
    expect(JSON.parse(String(options?.body))).toMatchObject({ p_actor: actor, p_revision: 1 });
    expect(String(options?.body)).not.toContain("attacker");
  });
  it("rejects failed RPC responses without disclosing database details", async () => {
    process.env.PASSPORT_TRANSACTIONAL_WRITES_ENABLED = "true";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"message":"sensitive SQL"}', { status: 403 }));
    await expect(executePassportMutation("review", actor, {})).rejects.toThrow("Passport transaction rejected");
  });
});
