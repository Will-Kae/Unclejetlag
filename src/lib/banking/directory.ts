/**
 * Uncle Jetlag Global Banking: institution directory.
 *
 * RULES (see docs/global-banking.md):
 * - Every identifier carries its source URL, source type and the date we checked it.
 * - Sources are the bank's own website or an official central-bank publication. Never a third-party
 *   directory (Wise, theswiftcodes.com, bank.codes, xe.com…): their terms forbid copying, and they go stale.
 * - Never invent institutions, branches or addresses. If a code isn't published officially, leave it out.
 * - Dated sources (older than about two years) are kept but labelled, so readers know to confirm.
 *
 * The shape mirrors the planned database tables (institutions, identifiers, data_sources), so this
 * file can be imported into Postgres later without reshaping anything.
 */
import { countryName } from "./iso-countries";

export type SourceType = "bank-website" | "central-bank";

export type Source = {
  url: string;
  title: string;
  type: SourceType;
  /** ISO date we opened the page and read the code. */
  checked: string;
  /** Publication year when the source itself is old (e.g. a 2017 central-bank list). */
  published?: string;
};

export type Identifier = {
  type: "BIC";
  /** Exactly as the source prints it, upper-cased. */
  value: string;
  /** What the code is for, when the source limits it (currency, amount, region, legacy accounts). */
  scope?: string;
  status: "listed" | "inactive";
  source: Source;
};

export type Institution = {
  id: string;
  slug: string;
  name: string;
  country: string;
  type: "bank";
  identifiers: Identifier[];
  notes?: string[];
};

const D1 = "2026-10-09";

const bw = (url: string, title: string, checked = D1): Source => ({ url, title, type: "bank-website", checked });
const bic = (value: string, source: Source, scope?: string): Identifier => ({ type: "BIC", value, source, scope, status: "listed" });

const BOG_2017: Source = { url: "https://www.bog.gov.gh/wp-content/uploads/2019/08/BANKS-BIC-Aug-2017.pdf", title: "Banks BIC (Bank of Ghana)", type: "central-bank", checked: D1, published: "2017" };

export const institutions: Institution[] = [
  // ── South Africa ──
  { id: "za-absa", slug: "absa", name: "Absa Bank", country: "ZA", type: "bank", identifiers: [bic("ABSAZAJJ", bw("https://www.absa.co.za/personal/bank/international-banking/swift/", "SWIFT payment system | Absa"))] },
  { id: "za-capitec", slug: "capitec", name: "Capitec Bank", country: "ZA", type: "bank", identifiers: [bic("CABLZAJJ", bw("https://www.capitecbank.co.za/personal/transact/foreign-exchange-services/", "Foreign exchange services | Capitec Bank"))] },
  { id: "za-discovery", slug: "discovery-bank", name: "Discovery Bank", country: "ZA", type: "bank", identifiers: [bic("DISCZAJJXXX", bw("https://www.discovery.co.za/bank/info-and-tips-payments", "Payments | Discovery"))], notes: ["Discovery says it accepts incoming international payments in USD, GBP, EUR and ZAR only; other currencies are returned. Its correspondent bank is HSBC Bank plc (MIDLGB22)."] },
  { id: "za-fnb", slug: "fnb", name: "FNB (First National Bank)", country: "ZA", type: "bank", identifiers: [bic("FIRNZAJJ", bw("https://www.fnb.co.za/forex/payments/global-receipts.html", "Global Receipts | FNB"))] },
  { id: "za-investec", slug: "investec", name: "Investec Bank", country: "ZA", type: "bank", identifiers: [bic("IVESZAJJ", bw("https://www.investec.com/en_int/investec-swift-code-details.html", "Investec SWIFT Code Details"))] },
  { id: "za-nedbank", slug: "nedbank", name: "Nedbank", country: "ZA", type: "bank", identifiers: [bic("NEDSZAJJ", bw("https://personal.nedbank.co.za/bank/international-banking/send-and-receive-international-payments/incoming-international-payments.html", "Incoming international payments | Nedbank"))] },
  { id: "za-standard-bank", slug: "standard-bank", name: "Standard Bank", country: "ZA", type: "bank", identifiers: [bic("SBZAZAJJ", bw("https://www.standardbank.co.za/southafrica/personal/learn/how-international-payments-work", "Making and receiving international payments | Standard Bank"))] },

  // ── Zimbabwe ──
  { id: "zw-cabs", slug: "cabs", name: "CABS", country: "ZW", type: "bank", identifiers: [bic("CABSZWHA", bw("https://www.cabs.co.zw/personal-banking/transactional-services/trade-international-payments", "Trade and International Payments | CABS"))] },
  { id: "zw-nmb", slug: "nmb-bank", name: "NMB Bank", country: "ZW", type: "bank", identifiers: [bic("NMBLZWHX", bw("https://nmbz.co.zw/nmb/correspondent-banking", "Correspondent Banking | NMB Bank"))] },
  { id: "zw-stanbic", slug: "stanbic-bank-zimbabwe", name: "Stanbic Bank Zimbabwe", country: "ZW", type: "bank", identifiers: [bic("SBICZWHXXXX", bw("https://www.stanbicbank.co.zw/static_file/zimbabwe/filedownloads/USD%20CORRESPONDENT%20BANK%20ACCOUNT%20DETAILS%20LAYOUT%202.pdf", "Stanbic Bank: change of USD correspondent bank"))] },
  { id: "zw-steward", slug: "steward-bank", name: "Steward Bank", country: "ZW", type: "bank", identifiers: [bic("STBLZWHX", bw("https://www.stewardbank.co.zw/international-banking/international-payments/", "International payments | Steward Bank"))] },

  // ── Kenya ──
  { id: "ke-coop", slug: "co-operative-bank", name: "Co-operative Bank of Kenya", country: "KE", type: "bank", identifiers: [bic("KCOOKENA", bw("https://www.co-opbank.co.ke/faq/bank-swift-code-and-bank-code/", "Bank swift code and bank code | Co-operative Bank"))] },
  { id: "ke-equity", slug: "equity-bank", name: "Equity Bank Kenya", country: "KE", type: "bank", identifiers: [bic("EQBLKENA", bw("https://equitygroupholdings.com/ke/pay-send-money/personal/money-transfer-services/swift-transfer/", "SWIFT Transfer | Equity Bank Kenya"))] },
  { id: "ke-ncba", slug: "ncba", name: "NCBA Bank Kenya", country: "KE", type: "bank", identifiers: [bic("CBAFKENX", bw("https://ke.ncbagroup.com/faqs/channels-faqs", "Channels FAQs | NCBA"))], notes: ["NCBA's FAQ gives this as the code after the CBA–NIC merger."] },
  { id: "ke-stanchart", slug: "standard-chartered-kenya", name: "Standard Chartered Bank Kenya", country: "KE", type: "bank", identifiers: [bic("SCBLKENXXXX", bw("https://www.sc.com/ke/business-cash-management-services/business-payments-services/", "Business Payments Services | Standard Chartered Kenya"))] },

  // ── Nigeria ──
  { id: "ng-access", slug: "access-bank", name: "Access Bank", country: "NG", type: "bank", identifiers: [bic("ABNGNGLA", bw("https://www.accessbankplc.com/access/media/Media-PDF-Attachment/Credit-Inflows.pdf", "Access Bank: credit inflow details"))] },
  { id: "ng-gtbank", slug: "gtbank", name: "GTBank (Guaranty Trust Bank)", country: "NG", type: "bank", identifiers: [bic("GTBINGLA", bw("https://www.gtbank.com/business-banking/international-trade/international-payments/foreign-currency-inward-transfer-fx-inflow", "Foreign currency inward transfer | GTBank"))] },
  { id: "ng-uba", slug: "uba", name: "UBA (United Bank for Africa)", country: "NG", type: "bank", identifiers: [bic("UNAFNGLA", bw("https://www.ubagroup.com/nigeria/wp-content/uploads/sites/3/2018/10/nigeria-swift-code.pdf", "Nigeria SWIFT codes | UBA"))] },

  // ── Zambia ──
  { id: "zm-fnb", slug: "fnb-zambia", name: "FNB Zambia", country: "ZM", type: "bank", identifiers: [bic("FIRNZMLX", bw("https://www.fnbzambia.co.zm/for-my-business/structured-trade-services/telegraphicTransfers.html", "Telegraphic Transfers | FNB Zambia"))] },
  { id: "zm-zanaco", slug: "zanaco", name: "Zanaco (Zambia National Commercial Bank)", country: "ZM", type: "bank", identifiers: [bic("ZNCOZMLU", bw("https://www.zanaco.co.zm/about-us/swift-and-sort-codes/", "Swift and Sort Codes | Zanaco"))] },

  // ── Ghana (Bank of Ghana list, 2017) ──
  { id: "gh-absa", slug: "absa-ghana", name: "Absa Bank Ghana", country: "GH", type: "bank", identifiers: [bic("BARCGHAC", BOG_2017)], notes: ["Listed by the Bank of Ghana under the bank's former name, Barclays Bank of Ghana."] },
  { id: "gh-ecobank", slug: "ecobank-ghana", name: "Ecobank Ghana", country: "GH", type: "bank", identifiers: [bic("ECOCGHAC", BOG_2017)] },
  { id: "gh-gcb", slug: "gcb-bank", name: "GCB Bank", country: "GH", type: "bank", identifiers: [bic("GHCBGHAC", BOG_2017)] },
  { id: "gh-stanbic", slug: "stanbic-bank-ghana", name: "Stanbic Bank Ghana", country: "GH", type: "bank", identifiers: [bic("SBICGHAC", BOG_2017)] },

  // ── Botswana ──
  { id: "bw-fnb", slug: "fnb-botswana", name: "FNB Botswana", country: "BW", type: "bank", identifiers: [bic("FIRNBWGX", { ...bw("https://www.fnbbotswana.co.bw/downloads/fnbBotswana/annual/FNBBAR2018.pdf", "FNB Botswana Annual Report 2018"), published: "2018" })] },
  { id: "bw-stanbic", slug: "stanbic-bank-botswana", name: "Stanbic Bank Botswana", country: "BW", type: "bank", identifiers: [bic("SBICBWGX", bw("https://www.stanbicbank.co.bw/botswana/personal/About-us/press-releases/We-Are-Stronger-Together,-United-for-Relief", "We Are Stronger Together | Stanbic Bank Botswana"))] },

  // ── United Kingdom ──
  { id: "gb-barclays", slug: "barclays", name: "Barclays Bank UK", country: "GB", type: "bank", identifiers: [bic("BUKBGB22", bw("https://www.barclays.co.uk/help/international/payments/making-and-receiving-international-payments/swift-code/", "SWIFT code | Barclays"))], notes: ["Barclays says branches may add three more characters to this code."] },
  { id: "gb-hsbc", slug: "hsbc-uk", name: "HSBC UK", country: "GB", type: "bank", identifiers: [bic("HBUKGB4B", bw("https://www.hsbc.co.uk/hfc-bank/", "HFC Bank FAQs | HSBC UK"))], notes: ["HSBC tells customers to check the BIC on their own statement or online banking."] },
  { id: "gb-lloyds", slug: "lloyds-bank", name: "Lloyds Bank", country: "GB", type: "bank", identifiers: [bic("LOYDGB2L", bw("https://www.lloydsbank.com/business/international/international-payments.html", "International Payments | Lloyds Bank"))], notes: ["Lloyds says some accounts that moved from Halifax show a code starting HLFX: use the one on your statement."] },
  { id: "gb-natwest", slug: "natwest", name: "NatWest", country: "GB", type: "bank", identifiers: [bic("NWBKGB2L", bw("https://www.natwest.com/business/support-centre/making-and-accepting-payments/electronic-payments/receiving-international-transfers.html", "Receiving international payments | NatWest"))] },
  { id: "gb-santander", slug: "santander-uk", name: "Santander UK", country: "GB", type: "bank", identifiers: [bic("ABBYGB2LXXX", bw("https://www.santander.co.uk/personal/support/current-accounts/making-international-payments", "International payments | Santander UK"))] },

  // ── United States ──
  { id: "us-bofa", slug: "bank-of-america", name: "Bank of America", country: "US", type: "bank", identifiers: [
    bic("BOFAUS3N", bw("https://info.bankofamerica.com/en/digital-banking/wire-transfers", "How to send wire transfers | Bank of America"), "Incoming wires in US dollars, or when the currency is unknown"),
    bic("BOFAUS6S", bw("https://info.bankofamerica.com/en/digital-banking/wire-transfers", "How to send wire transfers | Bank of America"), "Incoming wires in a foreign currency"),
  ] },
  { id: "us-chase", slug: "jpmorgan-chase", name: "JPMorgan Chase Bank", country: "US", type: "bank", identifiers: [bic("CHASUS33", bw("https://www.chase.com/digital/wire-transfer/faqs", "Wire Transfer FAQs | Chase"))], notes: ["Chase says Chase First Banking accounts can't receive wires."] },
  { id: "us-wells-fargo", slug: "wells-fargo", name: "Wells Fargo Bank", country: "US", type: "bank", identifiers: [bic("WFBIUS6S", bw("https://www.wellsfargo.com/help/routing-number/", "Routing & Account Number Information | Wells Fargo"))] },

  // ── Canada ──
  { id: "ca-bmo", slug: "bmo", name: "BMO (Bank of Montreal)", country: "CA", type: "bank", identifiers: [bic("BOFMCAM2", bw("https://www.bmo.com/en-ca/main/personal/ways-to-bank/request-money/", "Request Money Online | BMO"), "Wires from outside the US")], notes: ["BMO gives a different code, for BMO Bank N.A., for wires sent from the United States."] },
  { id: "ca-cibc", slug: "cibc", name: "CIBC", country: "CA", type: "bank", identifiers: [bic("CIBCCATT", bw("https://www.cibc.com/en/personal-banking/ways-to-bank/sending-receiving-wire-transfers.html", "Sending and Receiving Wire Transfers | CIBC"))], notes: ["For US dollars sent from the US, CIBC lists an intermediary bank on the same page."] },
  { id: "ca-rbc", slug: "rbc-royal-bank", name: "RBC Royal Bank", country: "CA", type: "bank", identifiers: [bic("ROYCCAT2", bw("https://www.rbcroyalbank.com/banking-services/wire-transfer.html", "Wire Transfer | RBC Royal Bank"))], notes: ["RBC lists a correspondent bank for each foreign currency on the same page."] },
  { id: "ca-scotiabank", slug: "scotiabank", name: "Scotiabank", country: "CA", type: "bank", identifiers: [bic("NOSCCATT", bw("https://help.scotiabank.com/article/how-do-i-receive-a-wire-transfer", "How do I receive a wire transfer? | Scotiabank"))], notes: ["For US dollar wires Scotiabank also lists an intermediary bank."] },
  { id: "ca-td", slug: "td-canada-trust", name: "TD Canada Trust", country: "CA", type: "bank", identifiers: [bic("TDOMCATTTOR", bw("https://www.td.com/ca/fr/services-bancaires-personnels/comment-faire/virement-de-fonds-international/virement-international-td", "Virement international TD | TD Canada Trust"), "All TD accounts and branches, according to TD")] },

  // ── Australia ──
  { id: "au-anz", slug: "anz", name: "ANZ", country: "AU", type: "bank", identifiers: [bic("ANZBAU3M", bw("https://www.anz.com.au/plus/support/payments/international-payments/payments-from-overseas-accounts/", "Payments from overseas accounts | ANZ"))] },
  { id: "au-cba", slug: "commonwealth-bank", name: "Commonwealth Bank", country: "AU", type: "bank", identifiers: [bic("CTBAAU2S", bw("https://www.commbank.com.au/personal/international/international-money-transfer/receiving-money-from-overseas.html", "Receiving money from overseas | CommBank"))] },
  { id: "au-nab", slug: "nab", name: "NAB (National Australia Bank)", country: "AU", type: "bank", identifiers: [
    bic("NATAAU3303M", bw("https://www.nab.com.au/help-support/personal-banking/manage-payments-transfers/swift-codes-for-international-transfers", "SWIFT codes for international transfers | NAB"), "NAB's preferred code"),
  ], notes: ["NAB also lists state-based codes on the same page. Use the one NAB gives for your account."] },
  { id: "au-westpac", slug: "westpac", name: "Westpac", country: "AU", type: "bank", identifiers: [bic("WPACAU2S", bw("https://www.westpac.com.au/faq/westpac-swift-code/", "What is Westpac's SWIFT code? | Westpac"))] },

  // ── Germany ──
  { id: "de-commerzbank", slug: "commerzbank", name: "Commerzbank", country: "DE", type: "bank", identifiers: [
    bic("COBADEFFXXX", bw("https://www.commerzbank.de/service/wo-finde-ich-meinen-bic-meine-blz-bankleitzahl/", "Wo finde ich meinen BIC? | Commerzbank")),
    bic("DRESDEFFXXX", bw("https://www.commerzbank.de/service/wo-finde-ich-meinen-bic-meine-blz-bankleitzahl/", "Wo finde ich meinen BIC? | Commerzbank"), "Former Dresdner Bank accounts"),
  ], notes: ["In Germany the IBAN is usually enough for euro payments; the BIC matters more for payments from outside the SEPA area."] },
  { id: "de-deutsche-bank", slug: "deutsche-bank", name: "Deutsche Bank", country: "DE", type: "bank", identifiers: [bic("DEUTDEFFXXX", bw("https://corporates.db.com/legal-resources/standard-settlement-instructions-frankfurt-foreign-exchange-DEUTDEFFXXX", "Standard Settlement Instructions Frankfurt | Deutsche Bank"), "Head office, Frankfurt")], notes: ["Branches can use their own codes. Check the BIC shown with your IBAN."] },

  // ── France ──
  { id: "fr-societe-generale", slug: "societe-generale", name: "Société Générale", country: "FR", type: "bank", identifiers: [bic("SOGEFRPP", bw("https://particuliers.sg.fr/securite/lexique", "Lexique sécurité bancaire | SG"))] },

  // ── United Arab Emirates ──
  { id: "ae-adcb", slug: "adcb", name: "Abu Dhabi Commercial Bank (ADCB)", country: "AE", type: "bank", identifiers: [bic("ADCBAEAA", bw("https://www.adcb.com/en/unb/", "ADCB: UNB account migration"))] },
  { id: "ae-mashreq", slug: "mashreq", name: "Mashreq", country: "AE", type: "bank", identifiers: [bic("BOMLAEAD", bw("https://www.mashreq.com/en/uae/neo/foreign-exchange/swift-transfers/", "Swift Transfer | Mashreq"), "All UAE branches, according to Mashreq")] },

  // ── India ──
  { id: "in-hdfc", slug: "hdfc-bank", name: "HDFC Bank", country: "IN", type: "bank", identifiers: [bic("HDFCINBB", bw("https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/9cbc836e-e7b2-4e9e-a335-1bc6c268bd0e", "SWIFT/Wire Transfer Form | HDFC Bank"))], notes: ["HDFC says it has no separate SWIFT codes for individual branches, and that a purpose code is mandatory on inward remittances."] },
  { id: "in-icici", slug: "icici-bank", name: "ICICI Bank", country: "IN", type: "bank", identifiers: [bic("ICICINBBNRI", bw("https://www.icici.bank.in/nri-banking/money-transfer/wire-transfer", "Wire Transfer | ICICI Bank"), "Remittances to India (NRI money transfer)")] },
  { id: "in-sbi", slug: "state-bank-of-india", name: "State Bank of India", country: "IN", type: "bank", identifiers: [bic("SBININBBFXD", bw("https://sbi.bank.in/web/nri/remittances/remittances-other-than-uk-canada-middle-east", "Remittances to India | SBI"), "Remittances up to USD 25,000")], notes: ["SBI says that above USD 25,000 you should use the SWIFT code of the recipient's home branch."] },
];

// ── Lookups ─────────────────────────────────────────────────────────────

export type BicMatch = { institution: Institution; identifier: Identifier; level: "exact" | "institution" };

export function findByBic(code: string): BicMatch | null {
  const c = code.toUpperCase();
  const c8 = c.slice(0, 8);
  const cIsHead = c.length === 8 || c.endsWith("XXX");
  let fallback: BicMatch | null = null;
  for (const inst of institutions) {
    for (const id of inst.identifiers) {
      const v = id.value;
      const vIsHead = v.length === 8 || v.endsWith("XXX");
      if (v === c || (cIsHead && vIsHead && v.slice(0, 8) === c8)) return { institution: inst, identifier: id, level: "exact" };
      if (!fallback && v.slice(0, 8) === c8) fallback = { institution: inst, identifier: id, level: "institution" };
    }
  }
  return fallback;
}

export function institutionsIn(country: string): Institution[] {
  return institutions.filter((i) => i.country === country).sort((a, b) => a.name.localeCompare(b.name));
}

export function getInstitution(country: string, slug: string): Institution | undefined {
  return institutions.find((i) => i.country === country.toUpperCase() && i.slug === slug);
}

export function directoryCountries(): string[] {
  return Array.from(new Set(institutions.map((i) => i.country))).sort((a, b) => countryName(a).localeCompare(countryName(b)));
}

export function isDatedSource(s: Source): boolean {
  return Boolean(s.published && Number(s.published) < new Date(s.checked).getFullYear() - 1);
}

// ── Search ──────────────────────────────────────────────────────────────

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokens = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);

/** Optimal string alignment distance (Levenshtein + adjacent transpositions), for one-typo tolerance. */
function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

export type SearchHit = { institution: Institution; score: number; reason: "bic" | "name" | "fuzzy" | "country" };

export function searchInstitutions(query: string, opts: { country?: string } = {}): SearchHit[] {
  const q = query.trim();
  const pool = opts.country ? institutions.filter((i) => i.country === opts.country) : institutions;
  if (!q) return pool.map((institution) => ({ institution, score: 0, reason: "country" as const }));

  const qUpper = q.replace(/\s/g, "").toUpperCase();
  const qTokens = tokens(q);
  const hits: SearchHit[] = [];

  for (const inst of pool) {
    let score = 0;
    let reason: SearchHit["reason"] = "name";
    // Exact or prefix identifier match ranks first.
    for (const id of inst.identifiers) {
      if (id.value === qUpper || (qUpper.length >= 8 && id.value.slice(0, 8) === qUpper.slice(0, 8))) { score = Math.max(score, 100); reason = "bic"; }
      else if (qUpper.length >= 4 && id.value.startsWith(qUpper)) { score = Math.max(score, 80); reason = "bic"; }
    }
    if (score < 80) {
      const nameTokens = tokens(inst.name);
      const cName = fold(countryName(inst.country));
      let matched = 0;
      let fuzzy = false;
      for (const t of qTokens) {
        if (nameTokens.some((n) => n.startsWith(t)) || cName.split(/\s+/).some((n) => n.startsWith(t)) || t === inst.country.toLowerCase()) matched++;
        else if (t.length >= 4 && nameTokens.some((n) => editDistance(n, t) <= 1)) { matched++; fuzzy = true; }
      }
      if (qTokens.length && matched === qTokens.length) {
        score = fuzzy ? 40 : 60;
        reason = fuzzy ? "fuzzy" : "name";
        if (fold(inst.name).startsWith(fold(q))) score += 10;
      }
    }
    if (score > 0) hits.push({ institution: inst, score, reason });
  }
  return hits.sort((a, b) => b.score - a.score || a.institution.name.localeCompare(b.institution.name));
}
