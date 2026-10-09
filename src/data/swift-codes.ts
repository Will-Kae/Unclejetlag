/**
 * SWIFT/BIC codes shown on /banking.
 *
 * Every code here was read on the bank's OWN website (URL kept in `source`) on the `checked` date.
 * Never add codes from third-party directories (Wise, theswiftcodes.com, etc.): Wise's terms ban
 * copying its site and SWIFT's free BIC search bans reproducing its directory. For banks not listed,
 * the page links readers to Wise's and SWIFT's own lookup tools instead.
 *
 * `code` is the 8-character head-office BIC. An 11-character code ending in XXX means the same thing.
 */
export type SwiftEntry = { country: string; bank: string; code: string; source: string; note?: string };

export const SWIFT_CHECKED = "2026-10-09";

export const swiftCodes: SwiftEntry[] = [
  // South Africa
  { country: "South Africa", bank: "Absa", code: "ABSAZAJJ", source: "https://www.absa.co.za/personal/bank/international-banking/swift/" },
  { country: "South Africa", bank: "Capitec", code: "CABLZAJJ", source: "https://www.capitecbank.co.za/personal/transact/foreign-exchange-services/" },
  { country: "South Africa", bank: "FNB (First National Bank)", code: "FIRNZAJJ", source: "https://www.fnb.co.za/forex/payments/global-receipts.html" },
  { country: "South Africa", bank: "Investec", code: "IVESZAJJ", source: "https://www.investec.com/en_int/investec-swift-code-details.html" },
  { country: "South Africa", bank: "Nedbank", code: "NEDSZAJJ", source: "https://personal.nedbank.co.za/bank/international-banking/send-and-receive-international-payments/incoming-international-payments.html" },
  { country: "South Africa", bank: "Standard Bank", code: "SBZAZAJJ", source: "https://www.standardbank.co.za/southafrica/personal/learn/how-international-payments-work" },
  // Zimbabwe
  { country: "Zimbabwe", bank: "CABS", code: "CABSZWHA", source: "https://www.cabs.co.zw/personal-banking/transactional-services/trade-international-payments" },
  { country: "Zimbabwe", bank: "NMB Bank", code: "NMBLZWHX", source: "https://nmbz.co.zw/nmb/correspondent-banking" },
  { country: "Zimbabwe", bank: "Stanbic Bank Zimbabwe", code: "SBICZWHX", source: "https://www.stanbicbank.co.zw/static_file/zimbabwe/filedownloads/USD%20CORRESPONDENT%20BANK%20ACCOUNT%20DETAILS%20LAYOUT%202.pdf", note: "Shown as SBICZWHXXXX (same code)" },
  { country: "Zimbabwe", bank: "Steward Bank", code: "STBLZWHX", source: "https://www.stewardbank.co.zw/international-banking/international-payments/" },
  // Kenya
  { country: "Kenya", bank: "Co-operative Bank of Kenya", code: "KCOOKENA", source: "https://www.co-opbank.co.ke/faq/bank-swift-code-and-bank-code/" },
  { country: "Kenya", bank: "Equity Bank Kenya", code: "EQBLKENA", source: "https://equitygroupholdings.com/ke/pay-send-money/personal/money-transfer-services/swift-transfer/" },
  { country: "Kenya", bank: "NCBA Bank Kenya", code: "CBAFKENX", source: "https://ke.ncbagroup.com/faqs/channels-faqs" },
  { country: "Kenya", bank: "Standard Chartered Kenya", code: "SCBLKENX", source: "https://www.sc.com/ke/business-cash-management-services/business-payments-services/", note: "Shown as SCBLKENXXXX (same code)" },
  // Nigeria
  { country: "Nigeria", bank: "Access Bank", code: "ABNGNGLA", source: "https://www.accessbankplc.com/access/media/Media-PDF-Attachment/Credit-Inflows.pdf" },
  { country: "Nigeria", bank: "GTBank (Guaranty Trust Bank)", code: "GTBINGLA", source: "https://www.gtbank.com/business-banking/international-trade/international-payments/foreign-currency-inward-transfer-fx-inflow" },
  { country: "Nigeria", bank: "UBA (United Bank for Africa)", code: "UNAFNGLA", source: "https://www.ubagroup.com/nigeria/wp-content/uploads/sites/3/2018/10/nigeria-swift-code.pdf" },
  // Zambia
  { country: "Zambia", bank: "FNB Zambia", code: "FIRNZMLX", source: "https://www.fnbzambia.co.zm/for-my-business/structured-trade-services/telegraphicTransfers.html" },
  { country: "Zambia", bank: "Zanaco", code: "ZNCOZMLU", source: "https://www.zanaco.co.zm/about-us/swift-and-sort-codes/" },
];

/** Official lookup tools for every bank not listed above. */
export const swiftLookups = [
  { name: "Wise SWIFT/BIC code finder", href: "https://wise.com/swift-codes", detail: "Browse codes by country and bank." },
  { name: "Wise SWIFT code checker", href: "https://wise.com/gb/swift-codes/bic-swift-code-checker", detail: "Paste a code to see which bank it belongs to." },
  { name: "SWIFT's official BIC search", href: "https://www2.swift.com/bsl/index.faces", detail: "Free search on swift.com, run by SWIFT itself." },
];
