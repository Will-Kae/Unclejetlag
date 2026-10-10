/**
 * Colour-contrast guard for design tokens (Phase 1C-C). WCAG 2.2 AA: 4.5:1 for normal text,
 * 3:1 for large text and non-text UI. Fails if a token change would reintroduce a contrast failure.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { categoryMeta } from "@/lib/passport/types";

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
const token = (name: string) => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --color-${name} not found`);
  return m[1];
};
const WHITE = "#ffffff";
const PAPER = token("paper");

describe("Passport Index category colours (white 12px text on coloured pills)", () => {
  for (const [key, meta] of Object.entries(categoryMeta)) {
    it(`${key} ${meta.colour} >= 4.5:1 with white`, () => {
      expect(contrast(meta.colour, WHITE)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("text colour tokens on page backgrounds", () => {
  for (const name of ["ink", "ink-2", "muted", "jet-ink", "sky", "palm", "amber"]) {
    for (const [bgName, bg] of [["white", WHITE], ["paper", PAPER]] as const) {
      it(`--color-${name} on ${bgName} >= 4.5:1`, () => {
        expect(contrast(token(name), bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
  it("white text on the brand orange button (--color-jet) >= 4.5:1", () => {
    expect(contrast(WHITE, token("jet"))).toBeGreaterThanOrEqual(4.5);
  });
  it("focus outline colour (--color-jet) >= 3:1 against paper and white", () => {
    expect(contrast(token("jet"), PAPER)).toBeGreaterThanOrEqual(3);
    expect(contrast(token("jet"), WHITE)).toBeGreaterThanOrEqual(3);
  });
});
