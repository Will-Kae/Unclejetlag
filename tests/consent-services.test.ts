/** Phase 3A: the two permissions (advertising consent vs. a tool activation) never mix. */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EMBEDDED_SERVICES, mayLoadAdvertising, mayLoadEmbedded, TRAVELPAYOUTS_DRIVE_SRC } from "@/lib/consent/services";

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
    for (const a of ['"data-utm-source": "unclejetlag"', '"data-utm-medium": "widget"', '"data-aff-code": "a_aid"', '"data-aff-channel": "code1"', 'const WIDGET_SRC = "https://www.discovercars.com/widget.js?v1"']) expect(dc).toContain(a);
    expect(read("src/components/partners/TravelInsuranceSection.tsx")).toContain('"https://widgets.genki.world/calculator?hue=111&saturation=46&with=unclejetlag"');
    expect(read("public/embeds/expedia-stays.html")).toContain('data-camref="1011l6tK2n"');
  });
  it("keeps AdSense out of the server-rendered head and behind advertising consent", () => {
    const layout = read("src/app/layout.tsx");
    const scripts = read("src/components/monetization/ThirdPartyScripts.tsx");
    expect(layout).not.toContain("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
    expect(scripts).toContain("ADSENSE_CLIENT && ads");
    expect(scripts).toContain("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
  });
  it("loads no executable Drive script from the layout", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toMatch(/id="travelpayouts"\s+type="text\/plain"/);
  });
});
