/** Passport baseline generators. Run only with UPDATE_BASELINE=1 (npm run harness:baseline or npm run passport:coverage). */
import { it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { coverageReport, methodologySnapshot, passportIndexSnapshot } from "./passport";

const write = (file: string, data: unknown) => fs.writeFileSync(path.join(__dirname, "../..", file), JSON.stringify(data, null, 1) + "\n");

/** Pretty at the top level, one line per array item: small, readable diffs for reviewers. */
const compact = (data: Record<string, unknown>) =>
  "{\n" +
  Object.entries(data)
    .map(([k, v]) => (Array.isArray(v) && v.length ? ` ${JSON.stringify(k)}: [\n${v.map((x) => `  ${JSON.stringify(x)}`).join(",\n")}\n ]` : ` ${JSON.stringify(k)}: ${JSON.stringify(v)}`))
    .join(",\n") +
  "\n}\n";

it.runIf(process.env.UPDATE_BASELINE === "1")("writes tests/fixtures/passport-index-snapshot.json (reproducibility)", () => {
  write("tests/fixtures/passport-index-snapshot.json", { note: "Scores, access maps and ranking gate for this dataset version under its recorded methodology. Regenerate only with an approved data or methodology change.", ...passportIndexSnapshot(), methodologies: methodologySnapshot() });
});

it.runIf(process.env.UPDATE_BASELINE === "1")("writes reports/passport-coverage.json (coverage)", () => {
  fs.writeFileSync(path.join(__dirname, "../..", "reports/passport-coverage.json"), compact(coverageReport()));
});
