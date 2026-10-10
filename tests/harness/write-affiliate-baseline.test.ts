/**
 * Baseline generator, not a regular test. Runs only with UPDATE_BASELINE=1:
 *   UPDATE_BASELINE=1 npx vitest run tests/harness/write-affiliate-baseline.test.ts
 */
import { it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { partners } from "@/data/partners";
import { callGo, VARIANTS } from "./go-route";

it.runIf(process.env.UPDATE_BASELINE === "1")("writes tests/fixtures/affiliate-contract.json", async () => {
  const out: Record<string, Record<string, unknown>> = {};
  for (const p of partners) {
    out[p.slug] = {};
    for (const q of VARIANTS) out[p.slug][q || "(none)"] = await callGo(p.slug, q);
  }
  const data = {
    note: "Generated from src/data/partners.ts via the real /go route handler. Same values as the source file; do not edit by hand.",
    activeSlugs: partners.filter((p) => p.active).map((p) => p.slug).sort(),
    partners: out,
  };
  fs.writeFileSync(path.join(__dirname, "../fixtures/affiliate-contract.json"), JSON.stringify(data, null, 2) + "\n");
});
