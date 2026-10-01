/**
 * Country registry — the join key for destinations, visa briefs, search and future
 * tools (visa checker, currency converter, country comparison).
 * Only stable facts belong here (names, ISO codes, region). Anything that changes
 * (visa rules, prices) lives in content files with an updated date.
 */
export type RegionKey =
  | "africa"
  | "europe"
  | "asia"
  | "middle-east"
  | "north-america"
  | "south-america"
  | "caribbean"
  | "oceania";

export const regions: { key: RegionKey; label: string; blurb: string; hue: [string, string] }[] = [
  { key: "africa", label: "Africa", blurb: "From Cape Town to Cairo: the continent most travel sites skip.", hue: ["#F2542D", "#F6A04D"] },
  { key: "europe", label: "Europe", blurb: "Schengen logic, rail passes and the price of a flat white.", hue: ["#1C4E80", "#5B8DC9"] },
  { key: "asia", label: "Asia", blurb: "Mega-cities, e-visas and super-apps.", hue: ["#B03A48", "#E77B6B"] },
  { key: "middle-east", label: "Middle East", blurb: "Hub airports, transit rules and desert stopovers.", hue: ["#B7791F", "#E3B35C"] },
  { key: "north-america", label: "North America", blurb: "Big distances, strict entry systems, tipping maths.", hue: ["#0E1A24", "#3F5A73"] },
  { key: "south-america", label: "South America", blurb: "Andes, Amazon and currency quirks.", hue: ["#1E7A5F", "#5DB38E"] },
  { key: "caribbean", label: "Caribbean", blurb: "Island hopping, entry forms and cash-vs-card.", hue: ["#0F8A9D", "#63C7C9"] },
  { key: "oceania", label: "Oceania", blurb: "Long flights, strict biosecurity and big skies.", hue: ["#4B3F8F", "#8C7FD1"] },
];

export type Country = {
  slug: string;
  name: string;
  iso2: string;
  region: RegionKey;
  aliases?: string[];
  demonym?: string;
};

export const countries: Country[] = [
  // Africa
  { slug: "south-africa", name: "South Africa", iso2: "ZA", region: "africa", aliases: ["SA", "RSA", "Cape Town", "Johannesburg", "Durban"], demonym: "South African" },
  { slug: "zimbabwe", name: "Zimbabwe", iso2: "ZW", region: "africa", aliases: ["Harare", "Victoria Falls"], demonym: "Zimbabwean" },
  { slug: "nigeria", name: "Nigeria", iso2: "NG", region: "africa", aliases: ["Lagos", "Abuja"], demonym: "Nigerian" },
  { slug: "kenya", name: "Kenya", iso2: "KE", region: "africa", aliases: ["Nairobi", "Mombasa"], demonym: "Kenyan" },
  { slug: "ghana", name: "Ghana", iso2: "GH", region: "africa", aliases: ["Accra"], demonym: "Ghanaian" },
  { slug: "egypt", name: "Egypt", iso2: "EG", region: "africa", aliases: ["Cairo"], demonym: "Egyptian" },
  { slug: "morocco", name: "Morocco", iso2: "MA", region: "africa", aliases: ["Marrakech", "Casablanca"], demonym: "Moroccan" },
  { slug: "tanzania", name: "Tanzania", iso2: "TZ", region: "africa", aliases: ["Zanzibar", "Dar es Salaam"], demonym: "Tanzanian" },
  { slug: "zambia", name: "Zambia", iso2: "ZM", region: "africa", aliases: ["Lusaka"], demonym: "Zambian" },
  { slug: "botswana", name: "Botswana", iso2: "BW", region: "africa", aliases: ["Gaborone"], demonym: "Motswana" },
  { slug: "namibia", name: "Namibia", iso2: "NA", region: "africa", aliases: ["Windhoek"], demonym: "Namibian" },
  { slug: "mozambique", name: "Mozambique", iso2: "MZ", region: "africa", aliases: ["Maputo"], demonym: "Mozambican" },
  { slug: "malawi", name: "Malawi", iso2: "MW", region: "africa", aliases: ["Lilongwe"], demonym: "Malawian" },
  { slug: "rwanda", name: "Rwanda", iso2: "RW", region: "africa", aliases: ["Kigali"], demonym: "Rwandan" },
  { slug: "ethiopia", name: "Ethiopia", iso2: "ET", region: "africa", aliases: ["Addis Ababa"], demonym: "Ethiopian" },
  { slug: "uganda", name: "Uganda", iso2: "UG", region: "africa", aliases: ["Kampala"], demonym: "Ugandan" },
  { slug: "mauritius", name: "Mauritius", iso2: "MU", region: "africa", aliases: ["Port Louis"], demonym: "Mauritian" },
  { slug: "senegal", name: "Senegal", iso2: "SN", region: "africa", aliases: ["Dakar"], demonym: "Senegalese" },
  // Europe
  { slug: "georgia", name: "Georgia", iso2: "GE", region: "europe", aliases: ["Tbilisi", "Batumi", "Sakartvelo"], demonym: "Georgian" },
  { slug: "united-kingdom", name: "United Kingdom", iso2: "GB", region: "europe", aliases: ["UK", "Britain", "Great Britain", "England", "Scotland", "Wales", "London"], demonym: "British" },
  { slug: "france", name: "France", iso2: "FR", region: "europe", aliases: ["Paris"], demonym: "French" },
  { slug: "germany", name: "Germany", iso2: "DE", region: "europe", aliases: ["Berlin", "Munich"], demonym: "German" },
  { slug: "spain", name: "Spain", iso2: "ES", region: "europe", aliases: ["Madrid", "Barcelona"], demonym: "Spanish" },
  { slug: "portugal", name: "Portugal", iso2: "PT", region: "europe", aliases: ["Lisbon", "Porto"], demonym: "Portuguese" },
  { slug: "italy", name: "Italy", iso2: "IT", region: "europe", aliases: ["Rome", "Milan"], demonym: "Italian" },
  { slug: "netherlands", name: "Netherlands", iso2: "NL", region: "europe", aliases: ["Holland", "Amsterdam"], demonym: "Dutch" },
  { slug: "ireland", name: "Ireland", iso2: "IE", region: "europe", aliases: ["Dublin"], demonym: "Irish" },
  { slug: "turkey", name: "Türkiye", iso2: "TR", region: "europe", aliases: ["Turkey", "Istanbul", "Antalya"], demonym: "Turkish" },
  { slug: "armenia", name: "Armenia", iso2: "AM", region: "europe", aliases: ["Yerevan"], demonym: "Armenian" },
  { slug: "albania", name: "Albania", iso2: "AL", region: "europe", aliases: ["Tirana"], demonym: "Albanian" },
  { slug: "serbia", name: "Serbia", iso2: "RS", region: "europe", aliases: ["Belgrade"], demonym: "Serbian" },
  { slug: "greece", name: "Greece", iso2: "GR", region: "europe", aliases: ["Athens"], demonym: "Greek" },
  // Asia
  { slug: "thailand", name: "Thailand", iso2: "TH", region: "asia", aliases: ["Bangkok", "Phuket"], demonym: "Thai" },
  { slug: "malaysia", name: "Malaysia", iso2: "MY", region: "asia", aliases: ["Kuala Lumpur", "KL"], demonym: "Malaysian" },
  { slug: "singapore", name: "Singapore", iso2: "SG", region: "asia", demonym: "Singaporean" },
  { slug: "indonesia", name: "Indonesia", iso2: "ID", region: "asia", aliases: ["Bali", "Jakarta"], demonym: "Indonesian" },
  { slug: "vietnam", name: "Vietnam", iso2: "VN", region: "asia", aliases: ["Hanoi", "Ho Chi Minh City", "Saigon"], demonym: "Vietnamese" },
  { slug: "japan", name: "Japan", iso2: "JP", region: "asia", aliases: ["Tokyo", "Osaka"], demonym: "Japanese" },
  { slug: "south-korea", name: "South Korea", iso2: "KR", region: "asia", aliases: ["Korea", "Seoul"], demonym: "South Korean" },
  { slug: "china", name: "China", iso2: "CN", region: "asia", aliases: ["Beijing", "Shanghai"], demonym: "Chinese" },
  { slug: "india", name: "India", iso2: "IN", region: "asia", aliases: ["Delhi", "Mumbai"], demonym: "Indian" },
  { slug: "sri-lanka", name: "Sri Lanka", iso2: "LK", region: "asia", aliases: ["Colombo"], demonym: "Sri Lankan" },
  { slug: "philippines", name: "Philippines", iso2: "PH", region: "asia", aliases: ["Manila"], demonym: "Filipino" },
  // Middle East
  { slug: "united-arab-emirates", name: "United Arab Emirates", iso2: "AE", region: "middle-east", aliases: ["UAE", "Emirates", "Dubai", "Abu Dhabi"], demonym: "Emirati" },
  { slug: "qatar", name: "Qatar", iso2: "QA", region: "middle-east", aliases: ["Doha"], demonym: "Qatari" },
  { slug: "saudi-arabia", name: "Saudi Arabia", iso2: "SA", region: "middle-east", aliases: ["KSA", "Riyadh", "Jeddah"], demonym: "Saudi" },
  { slug: "oman", name: "Oman", iso2: "OM", region: "middle-east", aliases: ["Muscat"], demonym: "Omani" },
  { slug: "jordan", name: "Jordan", iso2: "JO", region: "middle-east", aliases: ["Amman", "Petra"], demonym: "Jordanian" },
  { slug: "bahrain", name: "Bahrain", iso2: "BH", region: "middle-east", aliases: ["Manama"], demonym: "Bahraini" },
  // North America
  { slug: "canada", name: "Canada", iso2: "CA", region: "north-america", aliases: ["Toronto", "Vancouver", "Montreal"], demonym: "Canadian" },
  { slug: "united-states", name: "United States", iso2: "US", region: "north-america", aliases: ["USA", "US", "America", "New York"], demonym: "American" },
  { slug: "mexico", name: "Mexico", iso2: "MX", region: "north-america", aliases: ["Mexico City", "Cancun"], demonym: "Mexican" },
  { slug: "costa-rica", name: "Costa Rica", iso2: "CR", region: "north-america", aliases: ["San José"], demonym: "Costa Rican" },
  { slug: "panama", name: "Panama", iso2: "PA", region: "north-america", demonym: "Panamanian" },
  // South America
  { slug: "brazil", name: "Brazil", iso2: "BR", region: "south-america", aliases: ["Rio", "São Paulo"], demonym: "Brazilian" },
  { slug: "argentina", name: "Argentina", iso2: "AR", region: "south-america", aliases: ["Buenos Aires"], demonym: "Argentine" },
  { slug: "colombia", name: "Colombia", iso2: "CO", region: "south-america", aliases: ["Bogotá", "Medellín"], demonym: "Colombian" },
  { slug: "peru", name: "Peru", iso2: "PE", region: "south-america", aliases: ["Lima", "Cusco"], demonym: "Peruvian" },
  { slug: "chile", name: "Chile", iso2: "CL", region: "south-america", aliases: ["Santiago"], demonym: "Chilean" },
  { slug: "ecuador", name: "Ecuador", iso2: "EC", region: "south-america", aliases: ["Quito"], demonym: "Ecuadorian" },
  // Caribbean
  { slug: "jamaica", name: "Jamaica", iso2: "JM", region: "caribbean", aliases: ["Kingston"], demonym: "Jamaican" },
  { slug: "dominican-republic", name: "Dominican Republic", iso2: "DO", region: "caribbean", aliases: ["Punta Cana"], demonym: "Dominican" },
  { slug: "barbados", name: "Barbados", iso2: "BB", region: "caribbean", demonym: "Barbadian" },
  { slug: "bahamas", name: "Bahamas", iso2: "BS", region: "caribbean", aliases: ["Nassau"], demonym: "Bahamian" },
  { slug: "trinidad-and-tobago", name: "Trinidad and Tobago", iso2: "TT", region: "caribbean", demonym: "Trinidadian" },
  // Oceania
  { slug: "australia", name: "Australia", iso2: "AU", region: "oceania", aliases: ["Sydney", "Melbourne"], demonym: "Australian" },
  { slug: "new-zealand", name: "New Zealand", iso2: "NZ", region: "oceania", aliases: ["NZ", "Auckland"], demonym: "New Zealander" },
  { slug: "fiji", name: "Fiji", iso2: "FJ", region: "oceania", demonym: "Fijian" },
];

export const countriesBySlug = new Map(countries.map((c) => [c.slug, c]));

export function getCountry(slug: string) {
  return countriesBySlug.get(slug);
}

export function getRegion(key: string) {
  return regions.find((r) => r.key === key);
}

export function countriesInRegion(region: RegionKey) {
  return countries.filter((c) => c.region === region).sort((a, b) => a.name.localeCompare(b.name));
}
