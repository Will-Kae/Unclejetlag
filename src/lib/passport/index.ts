import { DATASET, rules, sources } from "./data";
import { jurisdictions } from "./jurisdictions";
import { scorePassport } from "./engine";

export * from "./types";
export * from "./jurisdictions";
export * from "./engine";
export * from "./methodology";
export * from "./verification";
export { rules, ruleRecords, sources, policyChanges, DATASET, SPRINT_1_PASSPORTS, EU_VISA_LIST_STATES } from "./data";

const sourceMap = new Map(sources.map((s) => [s.id, s]));
export const getSource = (id: string) => sourceMap.get(id);

export function datasetStats() {
  const pairs = new Set(rules.map((r) => `${r.passport}>${r.destination}`));
  const passportsWithData = new Set(rules.map((r) => r.passport));
  const destinationsWithData = new Set(rules.map((r) => r.destination));
  const checked = sources.map((s) => s.checked).sort();
  return {
    verifiedPairs: pairs.size,
    possiblePairs: jurisdictions.length * (jurisdictions.length - 1),
    passportsWithData: passportsWithData.size,
    destinationsWithData: destinationsWithData.size,
    sources: sources.length,
    lastChecked: checked.at(-1)!,
    datasetVersion: DATASET.version,
  };
}

export function verifiedCountFor(code: string) {
  return scorePassport(code).verified;
}
