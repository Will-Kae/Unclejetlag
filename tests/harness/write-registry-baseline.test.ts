/** Baseline generator. Runs only with UPDATE_BASELINE=1. */
import { it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { registrySnapshot } from "./registry";

it.runIf(process.env.UPDATE_BASELINE === "1")("writes tests/fixtures/registry-snapshot.json", () => {
  fs.writeFileSync(path.join(__dirname, "../fixtures/registry-snapshot.json"), JSON.stringify({ note: "Country identifiers the site's URLs depend on. Regenerate only for an approved change.", ...registrySnapshot() }, null, 1) + "\n");
});
