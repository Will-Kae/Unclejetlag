import { describe, expect, it } from "vitest";
import { discoverCarsFrameUrl, DISCOVERCARS_FRAME_TITLE } from "@/lib/partners/discovercars";

describe("DiscoverCars direct embed contract", () => {
  it("preserves the audited tracking and responsive parameters", () => {
    const url = new URL(discoverCarsFrameUrl("https://preview.example"));
    expect(url.origin + url.pathname).toBe("https://widget.discovercars.com/locations/");
    for (const [key, value] of Object.entries({ aff_code: "a_aid", aff_value: "unclejetlag", utm_source: "unclejetlag", utm_medium: "widget", responsive: "on", currency: "usd", widget_origin: "https://preview.example" })) {
      expect(url.searchParams.get(key), key).toBe(value);
    }
    expect(DISCOVERCARS_FRAME_TITLE).toBe("DiscoverCars car rental search");
  });
  it("encodes widget_origin without allowing it to replace affiliate parameters", () => {
    const origin = "https://preview.example/?aff_value=other&currency=eur";
    const url = new URL(discoverCarsFrameUrl(origin));
    expect(url.searchParams.get("widget_origin")).toBe(origin);
    expect(url.searchParams.get("aff_value")).toBe("unclejetlag");
    expect(url.searchParams.get("currency")).toBe("usd");
  });
});
