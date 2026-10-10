/**
 * Uncle Jetlag World Passport Index: canonical jurisdiction registry (Phase 2A).
 *
 * Published scope (methodology v0.1): the 193 UN member states, the two UN observer states
 * (Holy See, State of Palestine), Kosovo, Taiwan, and the Hong Kong and Macao SARs, which issue
 * their own passports and run their own border controls: 199 jurisdictions.
 * Each is both a passport issuer and a destination. Other territories are out of scope for v0.1.
 *
 * This table is the single source of truth for codes, names, slugs and regions. It is written out
 * explicitly (not generated from Intl at runtime) so that public URLs cannot move when the
 * runtime's ICU data changes. Names and slugs were frozen from the Phase 1A registry snapshot
 * (tests/fixtures/registry-snapshot.json) and must not change without an approved URL change.
 *
 * Identifiers: `code` is the ISO 3166-1 alpha-2 code, except Kosovo (XK), which is not in
 * ISO 3166-1 and uses a user-assigned code. Alpha-3 and numeric codes follow ISO 3166-1
 * (cross-checked against the Debian iso-codes data via pycountry 26.2.16); Kosovo has none.
 *
 * Regions are non-overlapping, so regional totals always add up. Africa uses the African Union's
 * five regions. See docs/passport-data-provenance.md.
 */
export type Region = "africa" | "europe" | "asia" | "middle-east" | "americas" | "oceania";
export type AfricaSubregion = "southern" | "east" | "central" | "west" | "north";
export type JurisdictionType = "un-member" | "un-observer" | "partially-recognised" | "sar";
/** How the code was assigned. "user-assigned" codes are outside ISO 3166-1 and must be documented here. */
export type IdentifierScheme = "iso-3166-1" | "user-assigned";

export const regions: { key: Region; label: string; slug: string }[] = [
  { key: "africa", label: "Africa", slug: "africa" },
  { key: "europe", label: "Europe", slug: "europe" },
  { key: "asia", label: "Asia", slug: "asia" },
  { key: "middle-east", label: "Middle East", slug: "middle-east" },
  { key: "americas", label: "Americas", slug: "americas" },
  { key: "oceania", label: "Oceania", slug: "oceania" },
];

export const africaSubregions: { key: AfricaSubregion; label: string }[] = [
  { key: "southern", label: "Southern Africa" },
  { key: "east", label: "East Africa" },
  { key: "west", label: "West Africa" },
  { key: "north", label: "North Africa" },
  { key: "central", label: "Central Africa" },
];

export type Jurisdiction = {
  code: string;
  /** ISO 3166-1 alpha-3, or null where ISO 3166-1 assigns none (Kosovo). */
  alpha3: string | null;
  /** ISO 3166-1 numeric, or null where ISO 3166-1 assigns none (Kosovo). */
  numeric: string | null;
  identifierScheme: IdentifierScheme;
  name: string;
  slug: string;
  region: Region;
  africaSubregion?: AfricaSubregion;
  type: JurisdictionType;
  /** Sovereign state this jurisdiction belongs to, for SARs only. */
  sovereign?: string;
  isPassportIssuer: true;
  isDestination: true;
  /** Status notes for jurisdictions whose recognition, identifiers or travel documents differ from the default. */
  notes?: string;
};

type Row = [code: string, alpha3: string | null, numeric: string | null, name: string, slug: string, region: Region, africaSubregion: AfricaSubregion | null, type: JurisdictionType];

/** Frozen registry, in display order (by English name). */
const TABLE: Row[] = [
  ["AF", "AFG", "004", "Afghanistan", "afghanistan", "asia", null, "un-member"],
  ["AL", "ALB", "008", "Albania", "albania", "europe", null, "un-member"],
  ["DZ", "DZA", "012", "Algeria", "algeria", "africa", "north", "un-member"],
  ["AD", "AND", "020", "Andorra", "andorra", "europe", null, "un-member"],
  ["AO", "AGO", "024", "Angola", "angola", "africa", "southern", "un-member"],
  ["AG", "ATG", "028", "Antigua & Barbuda", "antigua-barbuda", "americas", null, "un-member"],
  ["AR", "ARG", "032", "Argentina", "argentina", "americas", null, "un-member"],
  ["AM", "ARM", "051", "Armenia", "armenia", "asia", null, "un-member"],
  ["AU", "AUS", "036", "Australia", "australia", "oceania", null, "un-member"],
  ["AT", "AUT", "040", "Austria", "austria", "europe", null, "un-member"],
  ["AZ", "AZE", "031", "Azerbaijan", "azerbaijan", "asia", null, "un-member"],
  ["BS", "BHS", "044", "Bahamas", "bahamas", "americas", null, "un-member"],
  ["BH", "BHR", "048", "Bahrain", "bahrain", "middle-east", null, "un-member"],
  ["BD", "BGD", "050", "Bangladesh", "bangladesh", "asia", null, "un-member"],
  ["BB", "BRB", "052", "Barbados", "barbados", "americas", null, "un-member"],
  ["BY", "BLR", "112", "Belarus", "belarus", "europe", null, "un-member"],
  ["BE", "BEL", "056", "Belgium", "belgium", "europe", null, "un-member"],
  ["BZ", "BLZ", "084", "Belize", "belize", "americas", null, "un-member"],
  ["BJ", "BEN", "204", "Benin", "benin", "africa", "west", "un-member"],
  ["BT", "BTN", "064", "Bhutan", "bhutan", "asia", null, "un-member"],
  ["BO", "BOL", "068", "Bolivia", "bolivia", "americas", null, "un-member"],
  ["BA", "BIH", "070", "Bosnia & Herzegovina", "bosnia-herzegovina", "europe", null, "un-member"],
  ["BW", "BWA", "072", "Botswana", "botswana", "africa", "southern", "un-member"],
  ["BR", "BRA", "076", "Brazil", "brazil", "americas", null, "un-member"],
  ["BN", "BRN", "096", "Brunei", "brunei", "asia", null, "un-member"],
  ["BG", "BGR", "100", "Bulgaria", "bulgaria", "europe", null, "un-member"],
  ["BF", "BFA", "854", "Burkina Faso", "burkina-faso", "africa", "west", "un-member"],
  ["BI", "BDI", "108", "Burundi", "burundi", "africa", "central", "un-member"],
  ["KH", "KHM", "116", "Cambodia", "cambodia", "asia", null, "un-member"],
  ["CM", "CMR", "120", "Cameroon", "cameroon", "africa", "central", "un-member"],
  ["CA", "CAN", "124", "Canada", "canada", "americas", null, "un-member"],
  ["CV", "CPV", "132", "Cape Verde", "cape-verde", "africa", "west", "un-member"],
  ["CF", "CAF", "140", "Central African Republic", "central-african-republic", "africa", "central", "un-member"],
  ["TD", "TCD", "148", "Chad", "chad", "africa", "central", "un-member"],
  ["CL", "CHL", "152", "Chile", "chile", "americas", null, "un-member"],
  ["CN", "CHN", "156", "China", "china", "asia", null, "un-member"],
  ["CO", "COL", "170", "Colombia", "colombia", "americas", null, "un-member"],
  ["KM", "COM", "174", "Comoros", "comoros", "africa", "east", "un-member"],
  ["CG", "COG", "178", "Congo", "congo", "africa", "central", "un-member"],
  ["CR", "CRI", "188", "Costa Rica", "costa-rica", "americas", null, "un-member"],
  ["CI", "CIV", "384", "Côte d'Ivoire", "cote-divoire", "africa", "west", "un-member"],
  ["HR", "HRV", "191", "Croatia", "croatia", "europe", null, "un-member"],
  ["CU", "CUB", "192", "Cuba", "cuba", "americas", null, "un-member"],
  ["CY", "CYP", "196", "Cyprus", "cyprus", "europe", null, "un-member"],
  ["CZ", "CZE", "203", "Czechia", "czechia", "europe", null, "un-member"],
  ["DK", "DNK", "208", "Denmark", "denmark", "europe", null, "un-member"],
  ["DJ", "DJI", "262", "Djibouti", "djibouti", "africa", "east", "un-member"],
  ["DM", "DMA", "212", "Dominica", "dominica", "americas", null, "un-member"],
  ["DO", "DOM", "214", "Dominican Republic", "dominican-republic", "americas", null, "un-member"],
  ["CD", "COD", "180", "DR Congo", "dr-congo", "africa", "central", "un-member"],
  ["EC", "ECU", "218", "Ecuador", "ecuador", "americas", null, "un-member"],
  ["EG", "EGY", "818", "Egypt", "egypt", "africa", "north", "un-member"],
  ["SV", "SLV", "222", "El Salvador", "el-salvador", "americas", null, "un-member"],
  ["GQ", "GNQ", "226", "Equatorial Guinea", "equatorial-guinea", "africa", "central", "un-member"],
  ["ER", "ERI", "232", "Eritrea", "eritrea", "africa", "east", "un-member"],
  ["EE", "EST", "233", "Estonia", "estonia", "europe", null, "un-member"],
  ["SZ", "SWZ", "748", "Eswatini", "eswatini", "africa", "southern", "un-member"],
  ["ET", "ETH", "231", "Ethiopia", "ethiopia", "africa", "east", "un-member"],
  ["FJ", "FJI", "242", "Fiji", "fiji", "oceania", null, "un-member"],
  ["FI", "FIN", "246", "Finland", "finland", "europe", null, "un-member"],
  ["FR", "FRA", "250", "France", "france", "europe", null, "un-member"],
  ["GA", "GAB", "266", "Gabon", "gabon", "africa", "central", "un-member"],
  ["GM", "GMB", "270", "Gambia", "gambia", "africa", "west", "un-member"],
  ["GE", "GEO", "268", "Georgia", "georgia", "asia", null, "un-member"],
  ["DE", "DEU", "276", "Germany", "germany", "europe", null, "un-member"],
  ["GH", "GHA", "288", "Ghana", "ghana", "africa", "west", "un-member"],
  ["GR", "GRC", "300", "Greece", "greece", "europe", null, "un-member"],
  ["GD", "GRD", "308", "Grenada", "grenada", "americas", null, "un-member"],
  ["GT", "GTM", "320", "Guatemala", "guatemala", "americas", null, "un-member"],
  ["GN", "GIN", "324", "Guinea", "guinea", "africa", "west", "un-member"],
  ["GW", "GNB", "624", "Guinea-Bissau", "guinea-bissau", "africa", "west", "un-member"],
  ["GY", "GUY", "328", "Guyana", "guyana", "americas", null, "un-member"],
  ["HT", "HTI", "332", "Haiti", "haiti", "americas", null, "un-member"],
  ["HN", "HND", "340", "Honduras", "honduras", "americas", null, "un-member"],
  ["HK", "HKG", "344", "Hong Kong", "hong-kong", "asia", null, "sar"],
  ["HU", "HUN", "348", "Hungary", "hungary", "europe", null, "un-member"],
  ["IS", "ISL", "352", "Iceland", "iceland", "europe", null, "un-member"],
  ["IN", "IND", "356", "India", "india", "asia", null, "un-member"],
  ["ID", "IDN", "360", "Indonesia", "indonesia", "asia", null, "un-member"],
  ["IR", "IRN", "364", "Iran", "iran", "middle-east", null, "un-member"],
  ["IQ", "IRQ", "368", "Iraq", "iraq", "middle-east", null, "un-member"],
  ["IE", "IRL", "372", "Ireland", "ireland", "europe", null, "un-member"],
  ["IL", "ISR", "376", "Israel", "israel", "middle-east", null, "un-member"],
  ["IT", "ITA", "380", "Italy", "italy", "europe", null, "un-member"],
  ["JM", "JAM", "388", "Jamaica", "jamaica", "americas", null, "un-member"],
  ["JP", "JPN", "392", "Japan", "japan", "asia", null, "un-member"],
  ["JO", "JOR", "400", "Jordan", "jordan", "middle-east", null, "un-member"],
  ["KZ", "KAZ", "398", "Kazakhstan", "kazakhstan", "asia", null, "un-member"],
  ["KE", "KEN", "404", "Kenya", "kenya", "africa", "east", "un-member"],
  ["KI", "KIR", "296", "Kiribati", "kiribati", "oceania", null, "un-member"],
  ["XK", null, null, "Kosovo", "kosovo", "europe", null, "partially-recognised"],
  ["KW", "KWT", "414", "Kuwait", "kuwait", "middle-east", null, "un-member"],
  ["KG", "KGZ", "417", "Kyrgyzstan", "kyrgyzstan", "asia", null, "un-member"],
  ["LA", "LAO", "418", "Laos", "laos", "asia", null, "un-member"],
  ["LV", "LVA", "428", "Latvia", "latvia", "europe", null, "un-member"],
  ["LB", "LBN", "422", "Lebanon", "lebanon", "middle-east", null, "un-member"],
  ["LS", "LSO", "426", "Lesotho", "lesotho", "africa", "southern", "un-member"],
  ["LR", "LBR", "430", "Liberia", "liberia", "africa", "west", "un-member"],
  ["LY", "LBY", "434", "Libya", "libya", "africa", "north", "un-member"],
  ["LI", "LIE", "438", "Liechtenstein", "liechtenstein", "europe", null, "un-member"],
  ["LT", "LTU", "440", "Lithuania", "lithuania", "europe", null, "un-member"],
  ["LU", "LUX", "442", "Luxembourg", "luxembourg", "europe", null, "un-member"],
  ["MO", "MAC", "446", "Macao", "macao", "asia", null, "sar"],
  ["MG", "MDG", "450", "Madagascar", "madagascar", "africa", "east", "un-member"],
  ["MW", "MWI", "454", "Malawi", "malawi", "africa", "southern", "un-member"],
  ["MY", "MYS", "458", "Malaysia", "malaysia", "asia", null, "un-member"],
  ["MV", "MDV", "462", "Maldives", "maldives", "asia", null, "un-member"],
  ["ML", "MLI", "466", "Mali", "mali", "africa", "west", "un-member"],
  ["MT", "MLT", "470", "Malta", "malta", "europe", null, "un-member"],
  ["MH", "MHL", "584", "Marshall Islands", "marshall-islands", "oceania", null, "un-member"],
  ["MR", "MRT", "478", "Mauritania", "mauritania", "africa", "north", "un-member"],
  ["MU", "MUS", "480", "Mauritius", "mauritius", "africa", "east", "un-member"],
  ["MX", "MEX", "484", "Mexico", "mexico", "americas", null, "un-member"],
  ["FM", "FSM", "583", "Micronesia", "micronesia", "oceania", null, "un-member"],
  ["MD", "MDA", "498", "Moldova", "moldova", "europe", null, "un-member"],
  ["MC", "MCO", "492", "Monaco", "monaco", "europe", null, "un-member"],
  ["MN", "MNG", "496", "Mongolia", "mongolia", "asia", null, "un-member"],
  ["ME", "MNE", "499", "Montenegro", "montenegro", "europe", null, "un-member"],
  ["MA", "MAR", "504", "Morocco", "morocco", "africa", "north", "un-member"],
  ["MZ", "MOZ", "508", "Mozambique", "mozambique", "africa", "southern", "un-member"],
  ["MM", "MMR", "104", "Myanmar", "myanmar", "asia", null, "un-member"],
  ["NA", "NAM", "516", "Namibia", "namibia", "africa", "southern", "un-member"],
  ["NR", "NRU", "520", "Nauru", "nauru", "oceania", null, "un-member"],
  ["NP", "NPL", "524", "Nepal", "nepal", "asia", null, "un-member"],
  ["NL", "NLD", "528", "Netherlands", "netherlands", "europe", null, "un-member"],
  ["NZ", "NZL", "554", "New Zealand", "new-zealand", "oceania", null, "un-member"],
  ["NI", "NIC", "558", "Nicaragua", "nicaragua", "americas", null, "un-member"],
  ["NE", "NER", "562", "Niger", "niger", "africa", "west", "un-member"],
  ["NG", "NGA", "566", "Nigeria", "nigeria", "africa", "west", "un-member"],
  ["KP", "PRK", "408", "North Korea", "north-korea", "asia", null, "un-member"],
  ["MK", "MKD", "807", "North Macedonia", "north-macedonia", "europe", null, "un-member"],
  ["NO", "NOR", "578", "Norway", "norway", "europe", null, "un-member"],
  ["OM", "OMN", "512", "Oman", "oman", "middle-east", null, "un-member"],
  ["PK", "PAK", "586", "Pakistan", "pakistan", "asia", null, "un-member"],
  ["PW", "PLW", "585", "Palau", "palau", "oceania", null, "un-member"],
  ["PS", "PSE", "275", "Palestine", "palestine", "middle-east", null, "un-observer"],
  ["PA", "PAN", "591", "Panama", "panama", "americas", null, "un-member"],
  ["PG", "PNG", "598", "Papua New Guinea", "papua-new-guinea", "oceania", null, "un-member"],
  ["PY", "PRY", "600", "Paraguay", "paraguay", "americas", null, "un-member"],
  ["PE", "PER", "604", "Peru", "peru", "americas", null, "un-member"],
  ["PH", "PHL", "608", "Philippines", "philippines", "asia", null, "un-member"],
  ["PL", "POL", "616", "Poland", "poland", "europe", null, "un-member"],
  ["PT", "PRT", "620", "Portugal", "portugal", "europe", null, "un-member"],
  ["QA", "QAT", "634", "Qatar", "qatar", "middle-east", null, "un-member"],
  ["RO", "ROU", "642", "Romania", "romania", "europe", null, "un-member"],
  ["RU", "RUS", "643", "Russia", "russia", "europe", null, "un-member"],
  ["RW", "RWA", "646", "Rwanda", "rwanda", "africa", "east", "un-member"],
  ["WS", "WSM", "882", "Samoa", "samoa", "oceania", null, "un-member"],
  ["SM", "SMR", "674", "San Marino", "san-marino", "europe", null, "un-member"],
  ["ST", "STP", "678", "São Tomé & Príncipe", "sao-tome-principe", "africa", "central", "un-member"],
  ["SA", "SAU", "682", "Saudi Arabia", "saudi-arabia", "middle-east", null, "un-member"],
  ["SN", "SEN", "686", "Senegal", "senegal", "africa", "west", "un-member"],
  ["RS", "SRB", "688", "Serbia", "serbia", "europe", null, "un-member"],
  ["SC", "SYC", "690", "Seychelles", "seychelles", "africa", "east", "un-member"],
  ["SL", "SLE", "694", "Sierra Leone", "sierra-leone", "africa", "west", "un-member"],
  ["SG", "SGP", "702", "Singapore", "singapore", "asia", null, "un-member"],
  ["SK", "SVK", "703", "Slovakia", "slovakia", "europe", null, "un-member"],
  ["SI", "SVN", "705", "Slovenia", "slovenia", "europe", null, "un-member"],
  ["SB", "SLB", "090", "Solomon Islands", "solomon-islands", "oceania", null, "un-member"],
  ["SO", "SOM", "706", "Somalia", "somalia", "africa", "east", "un-member"],
  ["ZA", "ZAF", "710", "South Africa", "south-africa", "africa", "southern", "un-member"],
  ["KR", "KOR", "410", "South Korea", "south-korea", "asia", null, "un-member"],
  ["SS", "SSD", "728", "South Sudan", "south-sudan", "africa", "east", "un-member"],
  ["ES", "ESP", "724", "Spain", "spain", "europe", null, "un-member"],
  ["LK", "LKA", "144", "Sri Lanka", "sri-lanka", "asia", null, "un-member"],
  ["KN", "KNA", "659", "St. Kitts & Nevis", "st-kitts-nevis", "americas", null, "un-member"],
  ["LC", "LCA", "662", "St. Lucia", "st-lucia", "americas", null, "un-member"],
  ["VC", "VCT", "670", "St. Vincent & Grenadines", "st-vincent-grenadines", "americas", null, "un-member"],
  ["SD", "SDN", "729", "Sudan", "sudan", "africa", "east", "un-member"],
  ["SR", "SUR", "740", "Suriname", "suriname", "americas", null, "un-member"],
  ["SE", "SWE", "752", "Sweden", "sweden", "europe", null, "un-member"],
  ["CH", "CHE", "756", "Switzerland", "switzerland", "europe", null, "un-member"],
  ["SY", "SYR", "760", "Syria", "syria", "middle-east", null, "un-member"],
  ["TW", "TWN", "158", "Taiwan", "taiwan", "asia", null, "partially-recognised"],
  ["TJ", "TJK", "762", "Tajikistan", "tajikistan", "asia", null, "un-member"],
  ["TZ", "TZA", "834", "Tanzania", "tanzania", "africa", "east", "un-member"],
  ["TH", "THA", "764", "Thailand", "thailand", "asia", null, "un-member"],
  ["TL", "TLS", "626", "Timor-Leste", "timor-leste", "asia", null, "un-member"],
  ["TG", "TGO", "768", "Togo", "togo", "africa", "west", "un-member"],
  ["TO", "TON", "776", "Tonga", "tonga", "oceania", null, "un-member"],
  ["TT", "TTO", "780", "Trinidad & Tobago", "trinidad-tobago", "americas", null, "un-member"],
  ["TN", "TUN", "788", "Tunisia", "tunisia", "africa", "north", "un-member"],
  ["TR", "TUR", "792", "Türkiye", "turkiye", "europe", null, "un-member"],
  ["TM", "TKM", "795", "Turkmenistan", "turkmenistan", "asia", null, "un-member"],
  ["TV", "TUV", "798", "Tuvalu", "tuvalu", "oceania", null, "un-member"],
  ["UG", "UGA", "800", "Uganda", "uganda", "africa", "east", "un-member"],
  ["UA", "UKR", "804", "Ukraine", "ukraine", "europe", null, "un-member"],
  ["AE", "ARE", "784", "United Arab Emirates", "united-arab-emirates", "middle-east", null, "un-member"],
  ["GB", "GBR", "826", "United Kingdom", "united-kingdom", "europe", null, "un-member"],
  ["US", "USA", "840", "United States", "united-states", "americas", null, "un-member"],
  ["UY", "URY", "858", "Uruguay", "uruguay", "americas", null, "un-member"],
  ["UZ", "UZB", "860", "Uzbekistan", "uzbekistan", "asia", null, "un-member"],
  ["VU", "VUT", "548", "Vanuatu", "vanuatu", "oceania", null, "un-member"],
  ["VA", "VAT", "336", "Vatican City", "vatican-city", "europe", null, "un-observer"],
  ["VE", "VEN", "862", "Venezuela", "venezuela", "americas", null, "un-member"],
  ["VN", "VNM", "704", "Vietnam", "vietnam", "asia", null, "un-member"],
  ["YE", "YEM", "887", "Yemen", "yemen", "middle-east", null, "un-member"],
  ["ZM", "ZMB", "894", "Zambia", "zambia", "africa", "southern", "un-member"],
  ["ZW", "ZWE", "716", "Zimbabwe", "zimbabwe", "africa", "southern", "un-member"],
];

/** Documentation for every jurisdiction that is not a UN member state, or that uses a non-ISO code. */
export const JURISDICTION_NOTES: Record<string, { sovereign?: string; notes: string }> = {
  XK: { notes: "Not in ISO 3166-1. XK is a user-assigned code (ISO 3166-1 reserves X* codes for user assignment) and is the code already used for Kosovo in this site's banking data. No ISO alpha-3 or numeric code exists." },
  TW: { notes: "ISO 3166-1 TW / TWN / 158. Displayed as Taiwan. Issues its own passports and runs its own border control. Travel between Taiwan and mainland China uses permits, not passports (see SPECIAL_ENTRY_PAIRS)." },
  HK: { sovereign: "CN", notes: "Special Administrative Region of China. ISO 3166-1 HK / HKG / 344. Issues HKSAR passports and runs its own immigration control, separate from mainland China. Not a sovereign state." },
  MO: { sovereign: "CN", notes: "Special Administrative Region of China. ISO 3166-1 MO / MAC / 446. Issues Macao SAR passports and runs its own immigration control, separate from mainland China. Not a sovereign state." },
  VA: { notes: "UN observer state (the Holy See). ISO 3166-1 VA / VAT / 336." },
  PS: { notes: "UN observer state (State of Palestine). ISO 3166-1 PS / PSE / 275. Entry and exit conditions depend on border authorities that are not Palestinian; never infer access from a destination's rules for other passports." },
};

/**
 * Passport–destination pairs where travel normally uses a special permit rather than a passport and
 * visa. Rules for these pairs must not use a standard visa category without explaining the permit in
 * `conditions` (enforced by tests/passport-provenance.test.ts).
 */
export const SPECIAL_ENTRY_PAIRS: { passport: string; destination: string; note: string }[] = [
  { passport: "CN", destination: "HK", note: "Mainland residents travel to Hong Kong on a mainland exit-entry permit, not a PRC passport." },
  { passport: "CN", destination: "MO", note: "Mainland residents travel to Macao on a mainland exit-entry permit, not a PRC passport." },
  { passport: "HK", destination: "CN", note: "Hong Kong permanent residents of Chinese nationality enter the mainland with a Home Return Permit." },
  { passport: "MO", destination: "CN", note: "Macao permanent residents of Chinese nationality enter the mainland with a Home Return Permit." },
  { passport: "CN", destination: "TW", note: "Mainland residents travel to Taiwan with permits, not on a standard passport-and-visa basis." },
  { passport: "TW", destination: "CN", note: "Taiwan residents enter the mainland with a Mainland Travel Permit for Taiwan Residents." },
];

export const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const jurisdictions: Jurisdiction[] = TABLE.map(([code, alpha3, numeric, name, slug, region, sub, type]) => ({
  code,
  alpha3,
  numeric,
  identifierScheme: alpha3 ? "iso-3166-1" : "user-assigned",
  name,
  slug,
  region,
  africaSubregion: sub ?? undefined,
  type,
  ...(JURISDICTION_NOTES[code]?.sovereign ? { sovereign: JURISDICTION_NOTES[code].sovereign } : {}),
  isPassportIssuer: true as const,
  isDestination: true as const,
  ...(JURISDICTION_NOTES[code] ? { notes: JURISDICTION_NOTES[code].notes } : {}),
}));

const byCode = new Map(jurisdictions.map((j) => [j.code, j]));
const bySlug = new Map(jurisdictions.map((j) => [j.slug, j]));
export const getJurisdiction = (code: string) => byCode.get(code.toUpperCase());
export const getJurisdictionBySlug = (slug: string) => bySlug.get(slug);
export const jName = (code: string) => byCode.get(code)?.name ?? code;
export const flagOf = (code: string) => (/^[A-Z]{2}$/.test(code) && code !== "XK" ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "🏳️");
export const isSpecialEntryPair = (passport: string, destination: string) => SPECIAL_ENTRY_PAIRS.some((p) => p.passport === passport && p.destination === destination);
