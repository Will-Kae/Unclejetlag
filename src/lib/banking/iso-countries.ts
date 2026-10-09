/**
 * ISO 3166-1 alpha-2 country codes (all 249 officially assigned codes) plus XK (Kosovo),
 * which SWIFT uses in BICs. Names come from the runtime's Intl.DisplayNames so they stay correct
 * without a hand-maintained name list.
 */
const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW";

export const ISO_ALPHA2 = new Set([...CODES.split(" "), "XK"]);

let names: Intl.DisplayNames | null = null;

export function countryName(code: string): string {
  const c = code.toUpperCase();
  if (c === "XK") return "Kosovo";
  try {
    names ??= new Intl.DisplayNames(["en"], { type: "region" });
    return names.of(c) ?? c;
  } catch {
    return c;
  }
}

export function isCountryCode(code: string): boolean {
  return ISO_ALPHA2.has(code.toUpperCase());
}

/** Regional-indicator flag emoji for a country code (purely decorative). */
export function flag(code: string): string {
  const c = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}
