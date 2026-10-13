/**
 * Phase 3A: Travelpayouts tracking cookies written on our domain are removed whenever the permission
 * that allowed them is missing (on withdrawal and on every page load), and nothing else is removed.
 * _sp_id/_sp_ses belong to the flight-search analytics permission; am_user_session to advertising.
 */
import { describe, expect, it } from "vitest";
import { clearCookies, clearUnpermittedTrackingCookies, cookieDomainCandidates, expiryStrings, isTrackingCookie, TRACKING_COOKIE_PATTERNS } from "@/lib/consent/tracking-cookies";

const NONE = { ads: false, flightAnalytics: false };

/** Minimal cookie jar honouring Domain/host-only and Max-Age=0, enough to model document.cookie. */
function jar(host: string, initial: { name: string; domain?: string }[]) {
  let cookies = initial.map((c) => ({ ...c, value: "x" }));
  const writes: string[] = [];
  const doc = {
    get cookie() {
      return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    },
    set cookie(s: string) {
      writes.push(s);
      const [pair, ...attrs] = s.split(";").map((p) => p.trim());
      const name = pair.split("=")[0];
      const domain = attrs.find((a) => a.toLowerCase().startsWith("domain="))?.slice(7);
      if (attrs.some((a) => a === "Max-Age=0")) cookies = cookies.filter((c) => !(c.name === name && (c.domain ?? undefined) === (domain ?? undefined)));
    },
  };
  return { doc, writes, names: () => cookies.map((c) => c.name + (c.domain ? `@${c.domain}` : "")) };
}

describe("which cookies count as tracking cookies", () => {
  it("matches the three observed Travelpayouts cookies, whatever the site suffix", () => {
    for (const n of ["_sp_id.43e4", "_sp_ses.43e4", "_sp_id.4e6c", "_sp_ses.4e6c", "am_user_session"]) expect(isTrackingCookie(n), n).toBe(true);
  });
  it("never matches consent, preference, authentication or security cookies", () => {
    for (const n of ["uj_consent", "uj_flight_analytics", "_vercel_jwt", "__Host-session", "__Secure-auth", "_ga", "_sp_id", "_sp_idx.43e4", "_sp_id.43e45", "am_user_session_x", "sp_id.43e4", "csrf_token"]) expect(isTrackingCookie(n), n).toBe(false);
  });
});

describe("domains and paths", () => {
  it("covers the host and every parent domain, and skips IP addresses", () => {
    expect(cookieDomainCandidates("www.unclejetlag.com")).toEqual(["www.unclejetlag.com", "unclejetlag.com"]);
    expect(cookieDomainCandidates("unclejetlag.com")).toEqual(["unclejetlag.com"]);
    expect(cookieDomainCandidates("127.0.0.1")).toEqual([]);
    expect(cookieDomainCandidates("localhost")).toEqual([]);
  });
  it("expires at path / for host-only and each domain, with Secure on https", () => {
    const s = expiryStrings("_sp_id.43e4", "unclejetlag.com", true);
    expect(s).toHaveLength(2);
    for (const x of s) expect(x).toMatch(/^_sp_id\.43e4=; Path=\/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure/);
    expect(s[1]).toContain("; Domain=unclejetlag.com");
  });
});

describe("clearing without permission", () => {
  it("removes the production cookies with their real attributes and keeps everything else", () => {
    const j = jar("unclejetlag.com", [
      { name: "_sp_id.43e4", domain: "unclejetlag.com" },
      { name: "_sp_ses.43e4", domain: "unclejetlag.com" },
      { name: "am_user_session" },
      { name: "uj_consent" },
      { name: "_ga", domain: "unclejetlag.com" },
    ]);
    const removed = clearUnpermittedTrackingCookies(NONE, j.doc, { hostname: "unclejetlag.com", protocol: "https:" });
    expect(removed.sort()).toEqual(["_sp_id.43e4", "_sp_ses.43e4", "am_user_session"]);
    expect(j.names()).toEqual(["uj_consent", "_ga@unclejetlag.com"]);
    expect(j.writes.every((w) => /^(_sp_id\.43e4|_sp_ses\.43e4|am_user_session)=/.test(w))).toBe(true);
  });
  it("removes host-only cookies on a preview host where the domain is a public suffix", () => {
    const host = "unclejetlag-git-phase-3a.vercel.app";
    const j = jar(host, [{ name: "_sp_id.4e6c", domain: host }, { name: "_sp_ses.4e6c", domain: host }, { name: "am_user_session" }, { name: "uj_consent" }]);
    clearUnpermittedTrackingCookies(NONE, j.doc, { hostname: host, protocol: "https:" });
    expect(j.names()).toEqual(["uj_consent"]);
  });
  it("does nothing when no advertising cookie is present", () => {
    const j = jar("unclejetlag.com", [{ name: "uj_consent" }]);
    expect(clearUnpermittedTrackingCookies(NONE, j.doc, { hostname: "unclejetlag.com", protocol: "https:" })).toEqual([]);
    expect(j.writes).toEqual([]);
  });
  it("keeps the flight-search analytics cookies while that permission is allowed, and removes Drive's without ads consent", () => {
    const j = jar("unclejetlag.com", [{ name: "_sp_id.43e4", domain: "unclejetlag.com" }, { name: "_sp_ses.43e4", domain: "unclejetlag.com" }, { name: "am_user_session" }]);
    expect(clearUnpermittedTrackingCookies({ ads: false, flightAnalytics: true }, j.doc, { hostname: "unclejetlag.com", protocol: "https:" })).toEqual(["am_user_session"]);
    expect(j.names()).toEqual(["_sp_id.43e4@unclejetlag.com", "_sp_ses.43e4@unclejetlag.com"]);
  });
  it("advertising consent alone does not keep the flight-search analytics cookies", () => {
    const j = jar("unclejetlag.com", [{ name: "_sp_id.43e4", domain: "unclejetlag.com" }, { name: "am_user_session" }]);
    expect(clearUnpermittedTrackingCookies({ ads: true, flightAnalytics: false }, j.doc, { hostname: "unclejetlag.com", protocol: "https:" })).toEqual(["_sp_id.43e4"]);
    expect(j.names()).toEqual(["am_user_session"]);
  });
  it("touches nothing when both permissions are given", () => {
    const j = jar("unclejetlag.com", [{ name: "_sp_id.43e4" }, { name: "am_user_session" }]);
    expect(clearUnpermittedTrackingCookies({ ads: true, flightAnalytics: true }, j.doc, { hostname: "unclejetlag.com", protocol: "https:" })).toEqual([]);
    expect(j.writes).toEqual([]);
  });
  it("clearCookies with every pattern removes all three", () => {
    const j = jar("unclejetlag.com", [{ name: "_sp_id.43e4" }, { name: "_sp_ses.43e4" }, { name: "am_user_session" }, { name: "uj_flight_analytics" }]);
    expect(clearCookies(TRACKING_COOKIE_PATTERNS, j.doc, { hostname: "unclejetlag.com", protocol: "https:" }).sort()).toEqual(["_sp_id.43e4", "_sp_ses.43e4", "am_user_session"]);
    expect(j.names()).toEqual(["uj_flight_analytics"]);
  });
});
