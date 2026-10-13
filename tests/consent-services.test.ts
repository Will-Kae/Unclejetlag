/** Phase 3A: the two permissions (advertising consent vs. a tool activation) never mix. */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { EMBEDDED_SERVICES, FLIGHT_ANALYTICS, mayLoadAdvertising, mayLoadEmbedded, mayLoadFlightSearch, TRAVELPAYOUTS_DRIVE_SRC } from "@/lib/consent/services";

const ROOT = path.resolve(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("consent gates", () => {
  it("loads embedded tools only after the consent cookie is read, and only with ads consent or an activation", () => {
    for (const ready of [true, false]) for (const ads of [true, false]) for (const activated of [true, false]) {
      expect(mayLoadEmbedded({ ready, ads, activated }), JSON.stringify({ ready, ads, activated })).toBe(ready && (ads || activated));
    }
  });
  it("never lets a tool activation stand in for advertising consent", () => {
    expect(mayLoadAdvertising({ ready: true, ads: false })).toBe(false);
    expect(mayLoadAdvertising({ ready: false, ads: true })).toBe(false);
    expect(mayLoadAdvertising({ ready: true, ads: true })).toBe(true);
    expect(mayLoadAdvertising.length).toBe(1);
    expect(mayLoadAdvertising.toString()).not.toMatch(/activated/);
  });
  it("loads the flight search only after its own explicit allow, never on ads consent or an activation", () => {
    for (const ready of [true, false]) for (const flightAnalytics of [true, false, null]) {
      expect(mayLoadFlightSearch({ ready, flightAnalytics }), JSON.stringify({ ready, flightAnalytics })).toBe(ready && flightAnalytics === true);
    }
    expect(mayLoadFlightSearch.toString()).not.toMatch(/\bads\b|activated/);
  });
  it("discloses the flight-search analytics cookies, purpose and lifetime", () => {
    expect(FLIGHT_ANALYTICS.provider).toBe("Travelpayouts");
    expect(FLIGHT_ANALYTICS.cookies.map((c) => c.name)).toEqual(["_sp_id.*", "_sp_ses.*"]);
    expect(FLIGHT_ANALYTICS.cookies[0].lifetime).toBe("about 13 months");
    const component = read("src/components/consent/FlightSearchConsent.tsx");
    expect(component).toContain("Allow and load flight search");
    expect(component).toContain("No thanks");
    expect(read("src/components/partners/TravelpayoutsFlightsWidget.tsx")).not.toContain("ConsentGate");
  });
  it("covers the four embedded partner tools", () => {
    expect(Object.keys(EMBEDDED_SERVICES).sort()).toEqual(["discovercars", "expedia-stays", "genki-calculator", "travelpayouts-flights"]);
  });
});

describe("partner identifiers are unchanged", () => {
  it("keeps the Travelpayouts Drive URL exactly as issued", () => {
    expect(TRAVELPAYOUTS_DRIVE_SRC).toBe("https://emrldtp.cc/NTgyNzYz.js?t=582763");
  });
  it("keeps every widget's tracking parameters exactly as issued", () => {
    expect(read("src/components/partners/TravelpayoutsFlightsWidget.tsx")).toContain(
      "https://tpwidg.com/content?currency=usd&trs=582763&shmarker=786947.786947&locale=en&stops=any&show_hotels=false&powered_by=true&border_radius=0&plain=false&color_button=%23101C30&color_button_text=%23ffffff&promo_id=3414&campaign_id=111",
    );
    const dc = read("src/components/partners/DiscoverCarsWidget.tsx");
    expect(dc).not.toContain("https://www.discovercars.com/widget.js");
    expect(dc).toContain("title={DISCOVERCARS_FRAME_TITLE}");
    expect(read("src/components/partners/TravelInsuranceSection.tsx")).toContain('"https://widgets.genki.world/calculator?hue=111&saturation=46&with=unclejetlag"');
    expect(read("public/embeds/expedia-stays.html")).toContain('data-camref="1011l6tK2n"');
  });
  it("keeps AdSense out of the server-rendered head and behind the independent release gate", () => {
    const layout = read("src/app/layout.tsx");
    const scripts = read("src/components/monetization/ThirdPartyScripts.tsx");
    expect(layout).not.toContain("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
    expect(scripts).toContain("ADSENSE_ACTIVE && (");
    expect(scripts).not.toContain("ADSENSE_ACTIVE && ads");
    expect(scripts).toContain("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
  });
  it("loads no executable Drive script from the layout", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toMatch(/id="travelpayouts"\s+type="text\/plain"/);
  });
});

describe("AdSense is off for this release (certified CMP planned for Phase 3B)", () => {
  it("stays inactive even when a publisher ID is configured", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-0000000000000000");
    const cfg = await import("@/components/monetization/ads-config");
    expect(cfg.ADSENSE_CLIENT).toBe("ca-pub-0000000000000000");
    expect(cfg.ADSENSE_RELEASE_ENABLED).toBe(false);
    expect(cfg.ADSENSE_CMP_VERIFIED).toBe(false);
    expect(cfg.ADSENSE_SLOTS_ENABLED).toBe(false);
    expect(cfg.ADSENSE_ACTIVE).toBe(false);
    vi.unstubAllEnvs();
  });
  it("gates every AdSense request on ADSENSE_ACTIVE (script and ad slots)", () => {
    expect(read("src/components/monetization/ThirdPartyScripts.tsx")).not.toMatch(/\{ADSENSE_CLIENT &&/);
    expect(read("src/components/monetization/AdSlot.tsx")).toContain("const live = Boolean(ADSENSE_ACTIVE && ADSENSE_SLOTS_ENABLED);");
  });
});

describe("Phase 3B: certified Google consent remains independent", () => {
  it("does not derive Google advertising Consent Mode grants from affiliate ads preference", () => {
    const provider = read("src/components/consent/ConsentProvider.tsx");
    const bridge = provider.slice(provider.indexOf("function applyToGoogle("), provider.indexOf("export function ConsentProvider("));
    expect(bridge).toContain('analytics_storage: c.analytics ? "granted" : "denied"');
    expect(bridge).not.toMatch(/ad_storage\s*:\s*c\.ads|ad_user_data\s*:\s*c\.ads|ad_personalization\s*:\s*c\.ads/);
    const defaults = provider.slice(provider.indexOf("export const consentDefaultsScript"));
    for (const signal of ["ad_storage", "ad_user_data", "ad_personalization"]) {
      expect(defaults).toContain(signal + ":'denied'");
    }
  });

  it("keeps the footer preference control and consent-open event wired together", () => {
    expect(read("src/components/layout/Footer.tsx")).toContain("<CookieSettingsButton");
    expect(read("src/components/consent/CookieBanner.tsx")).toContain('new Event("uj:open-consent")');
    expect(read("src/components/consent/ConsentProvider.tsx")).toContain('window.addEventListener("uj:open-consent", open)');
  });
});


describe("Phase 3B release guardrails", () => {
  it("does not mistake affiliate acceptance for certified Google advertising consent", () => {
    const banner = read("src/components/consent/CookieBanner.tsx");
    expect(banner).toContain("Accept site preferences");
    expect(banner).toContain("does not grant Google AdSense consent");
    expect(banner).toContain("Google advertising privacy choices");
  });
  it("requires independent CMP verification before AdSense can activate", () => {
    const config = read("src/components/monetization/ads-config.ts");
    expect(config).toContain("ADSENSE_CMP_VERIFIED = false");
    expect(config).toContain("ADSENSE_RELEASE_ENABLED && ADSENSE_CMP_VERIFIED");
    expect(config).toContain("ADSENSE_SLOTS_ENABLED = false");
  });
});
