/**
 * Versioned methodology. Changing weights or eligibility means adding a new version, never editing a
 * published one. Scores always carry the version they were calculated under.
 */
import type { AccessCategory } from "./types";

export type MethodologyVersion = {
  id: string;
  effective: string;
  status: "draft" | "published";
  /** Categories that count towards the Global Mobility Ranking. */
  mobilityCategories: AccessCategory[];
  powerWeights: { visaFree: number; visaOnArrival: number; eta: number; entryConvenience: number; regional: number };
  /** Minimum share of a passport's destination universe that must be verified before it gets a score. */
  passportCoverageThreshold: number;
  /** Minimum share of all passports that must be scored before a worldwide ranking is published. */
  rankingPublicationThreshold: number;
  /** Records older than this many days are flagged for re-verification. */
  freshnessDays: number;
  changelog: string[];
};

export const methodologies: MethodologyVersion[] = [
  {
    id: "0.1",
    effective: "2026-10-10",
    status: "draft",
    mobilityCategories: ["visa-free", "visa-on-arrival", "eta"],
    powerWeights: { visaFree: 50, visaOnArrival: 20, eta: 15, entryConvenience: 10, regional: 5 },
    passportCoverageThreshold: 0.95,
    rankingPublicationThreshold: 0.9,
    freshnessDays: 180,
    changelog: ["First draft. Weights are starting values and will be sensitivity-tested before publication."],
  },
];

export const currentMethodology = methodologies[methodologies.length - 1];
