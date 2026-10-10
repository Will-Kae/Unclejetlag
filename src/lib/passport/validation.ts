/**
 * Integrity checks for the jurisdiction registry and the rule dataset (Phase 2A). Each returns a list
 * of human-readable issues; an empty list means the data is consistent. Run by tests on every change.
 */
import { JURISDICTION_NOTES, SPECIAL_ENTRY_PAIRS, slugify, type Jurisdiction } from "./jurisdictions";
import { SOURCE_TIER, type AccessRule, type PolicyChange, type Source } from "./types";
import { isIsoDate, ruleId, VERIFICATION_STATUSES } from "./verification";

/** Domains that may be used to find an official page but never cited as evidence. */
export const LEAD_ONLY_DOMAINS = /wikipedia|wikidata|henley|passportindex|visahq|ivisa|visaguide|timatic|iata\.org|sherpa|visaindex|atlys|onlinevisa/i;

/** Supranational authorities that can issue rules for several registry jurisdictions. */
export const SUPRANATIONAL_AUTHORITIES = ["EU"];

export function validateRegistry(list: Jurisdiction[], isoAlpha2: Set<string>): string[] {
  const issues: string[] = [];
  const dup = (label: string, values: (string | null)[]) => {
    const seen = new Set<string>();
    for (const v of values) if (v !== null) { if (seen.has(v)) issues.push(`duplicate ${label}: ${v}`); seen.add(v); }
  };
  dup("code", list.map((j) => j.code));
  dup("slug", list.map((j) => j.slug));
  dup("alpha3", list.map((j) => j.alpha3));
  dup("numeric", list.map((j) => j.numeric));
  const codes = new Set(list.map((j) => j.code));
  for (const j of list) {
    if (!/^[A-Z]{2}$/.test(j.code)) issues.push(`${j.code}: code is not two capital letters`);
    if (j.identifierScheme === "iso-3166-1") {
      if (!isoAlpha2.has(j.code)) issues.push(`${j.code}: not an ISO 3166-1 alpha-2 code`);
      if (!j.alpha3 || !/^[A-Z]{3}$/.test(j.alpha3)) issues.push(`${j.code}: ISO jurisdiction needs an alpha-3 code`);
      if (!j.numeric || !/^\d{3}$/.test(j.numeric)) issues.push(`${j.code}: ISO jurisdiction needs a numeric code`);
    } else {
      if (isoAlpha2.has(j.code)) issues.push(`${j.code}: marked user-assigned but is an ISO code`);
      if (!JURISDICTION_NOTES[j.code]) issues.push(`${j.code}: user-assigned code is not documented`);
      if (j.alpha3 || j.numeric) issues.push(`${j.code}: user-assigned code must not claim ISO alpha-3/numeric`);
    }
    if (j.slug !== slugify(j.name)) issues.push(`${j.code}: slug ${j.slug} does not match name ${j.name}`);
    if (j.type !== "un-member" && !j.notes) issues.push(`${j.code}: ${j.type} jurisdiction needs a status note`);
    if (j.type === "sar" && (!j.sovereign || !codes.has(j.sovereign))) issues.push(`${j.code}: SAR needs a sovereign in the registry`);
    if (j.type !== "sar" && j.sovereign) issues.push(`${j.code}: only SARs carry a sovereign`);
    if ((j.region === "africa") !== Boolean(j.africaSubregion)) issues.push(`${j.code}: African jurisdictions (and only they) need an AU subregion`);
  }
  for (const p of SPECIAL_ENTRY_PAIRS) if (!codes.has(p.passport) || !codes.has(p.destination)) issues.push(`special entry pair ${p.passport}>${p.destination} uses an unknown code`);
  return issues;
}

export function validateDataset(records: AccessRule[], sources: Source[], policyChanges: PolicyChange[], registry: Jurisdiction[], asOf: string): string[] {
  const issues: string[] = [];
  const codes = new Set(registry.map((j) => j.code));
  const sourceIds = new Set<string>();
  for (const s of sources) {
    if (sourceIds.has(s.id)) issues.push(`duplicate source id ${s.id}`);
    sourceIds.add(s.id);
    if (!/^https:\/\//.test(s.url)) issues.push(`${s.id}: URL must be https`);
    if (LEAD_ONLY_DOMAINS.test(s.url)) issues.push(`${s.id}: lead-only domain cited as evidence`);
    if (!(s.type in SOURCE_TIER)) issues.push(`${s.id}: unknown source type ${s.type}`);
    if (!isIsoDate(s.checked)) issues.push(`${s.id}: checked is not a valid date`);
    else if (s.checked > asOf) issues.push(`${s.id}: checked ${s.checked} is after the dataset date ${asOf}`);
    if (s.sourceUpdated !== undefined) {
      if (!isIsoDate(s.sourceUpdated)) issues.push(`${s.id}: sourceUpdated is not a valid date`);
      else if (s.sourceUpdated > s.checked) issues.push(`${s.id}: sourceUpdated ${s.sourceUpdated} is after the date we read it`);
    }
    if (!s.authorityJurisdiction) issues.push(`${s.id}: authorityJurisdiction missing`);
    else if (!codes.has(s.authorityJurisdiction) && !SUPRANATIONAL_AUTHORITIES.includes(s.authorityJurisdiction)) issues.push(`${s.id}: unknown authority jurisdiction ${s.authorityJurisdiction}`);
  }
  const ids = new Map<string, AccessRule>();
  for (const r of records) {
    const id = ruleId(r);
    if (ids.has(id)) issues.push(`duplicate rule ${id} (one source may state one category per pair)`);
    ids.set(id, r);
    if (!codes.has(r.passport)) issues.push(`${id}: unknown passport ${r.passport}`);
    if (!codes.has(r.destination)) issues.push(`${id}: unknown destination ${r.destination}`);
    if (r.passport === r.destination) issues.push(`${id}: passport and destination are the same`);
    if (!sourceIds.has(r.sourceId)) issues.push(`${id}: source ${r.sourceId} not registered`);
    for (const extra of r.additionalSourceIds ?? []) if (!sourceIds.has(extra)) issues.push(`${id}: supporting source ${extra} not registered`);
    if (!r.evidence || r.evidence.trim().length < 6) issues.push(`${id}: evidence missing`);
    if (!VERIFICATION_STATUSES.includes(r.verification)) issues.push(`${id}: unknown status ${r.verification}`);
    if (r.effectiveFrom !== undefined && !isIsoDate(r.effectiveFrom)) issues.push(`${id}: effectiveFrom is not a valid date`);
    if (r.effectiveTo !== undefined && !isIsoDate(r.effectiveTo)) issues.push(`${id}: effectiveTo is not a valid date`);
    if (r.effectiveFrom && r.effectiveTo && r.effectiveFrom > r.effectiveTo) issues.push(`${id}: effectiveFrom is after effectiveTo`);
    if (r.maxStayDays !== undefined && (!Number.isInteger(r.maxStayDays) || r.maxStayDays <= 0)) issues.push(`${id}: maxStayDays must be a positive whole number`);
    if (r.category === "conditional" && !r.conditions) issues.push(`${id}: conditional access must state its conditions`);
    if (r.category === "unknown") issues.push(`${id}: "unknown" is the absence of a rule, not a rule category`);
    if ((r.verification === "superseded") !== Boolean(r.supersededBy)) issues.push(`${id}: supersededBy is required on (and only on) superseded rules`);
    if (SPECIAL_ENTRY_PAIRS.some((p) => p.passport === r.passport && p.destination === r.destination) && !r.conditions) issues.push(`${id}: special entry pair needs conditions explaining the permit`);
  }
  for (const r of records) {
    const id = ruleId(r);
    if (r.supersededBy && !ids.has(r.supersededBy)) issues.push(`${id}: supersededBy ${r.supersededBy} does not exist`);
    for (const o of r.overrides ?? []) {
      const target = ids.get(o);
      if (!target) issues.push(`${id}: overrides unknown rule ${o}`);
      else if (target.passport !== r.passport || target.destination !== r.destination) issues.push(`${id}: overrides a rule for a different pair`);
    }
  }
  const cited = new Set([...records.flatMap((r) => [r.sourceId, ...(r.additionalSourceIds ?? [])]), ...policyChanges.map((p) => p.sourceId)]);
  for (const s of sources) if (!cited.has(s.id)) issues.push(`${s.id}: orphaned source (cited by no rule or policy change)`);
  for (const p of policyChanges) {
    if (!sourceIds.has(p.sourceId)) issues.push(`policy change ${p.id}: source ${p.sourceId} not registered`);
    for (const c of [...p.passports, p.destination]) if (!codes.has(c)) issues.push(`policy change ${p.id}: unknown code ${c}`);
    if (!isIsoDate(p.effective) || !isIsoDate(p.verified)) issues.push(`policy change ${p.id}: invalid date`);
  }
  return issues;
}
