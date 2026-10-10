/**
 * Passport Index snapshots (Phase 2A).
 * - passportIndexSnapshot(): every passport's score under the recorded methodology, the access map of
 *   every passport with verified data, the ranking gate and a sample comparison. Used to prove scores
 *   and rankings are reproducible for a dataset version and methodology.
 * - coverageReport(): the machine-readable coverage report committed at reports/passport-coverage.json.
 */
import { jurisdictions } from "@/lib/passport/jurisdictions";
import { accessFor, comparePassports, rankingStatus, scorePassport } from "@/lib/passport/engine";
import { datasetStats } from "@/lib/passport";
import { DATASET, ruleRecords, sources } from "@/lib/passport/data";
import { buildCoverageReport } from "@/lib/passport/coverage";
import { methodologies } from "@/lib/passport/methodology";

export function passportIndexSnapshot() {
  const scores = jurisdictions.map((j) => scorePassport(j.code));
  const access = Object.fromEntries(
    scores.filter((s) => s.verified > 0).map((s) => [s.passport, Object.fromEntries(accessFor(s.passport).filter((a) => a.category !== "unknown").map((a) => [a.destination, a.category]))]),
  );
  const cmp = comparePassports("ZW", "ZA", "no-advance-visa");
  return {
    methodology: DATASET.methodology,
    rankingStatus: rankingStatus(),
    datasetStats: datasetStats(),
    scores,
    access,
    compareZWZA: { both: cmp.both, onlyA: cmp.onlyA, onlyB: cmp.onlyB, unverified: cmp.unverified.length },
  };
}

export const methodologySnapshot = () => methodologies;

export const coverageReport = () => buildCoverageReport(ruleRecords, sources, DATASET);
