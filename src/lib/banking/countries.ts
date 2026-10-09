/**
 * Country banking guides for /banks/[country].
 *
 * IBAN usage and length are not written by hand: they come from ibanCountryUsage() (SWIFT IBAN
 * Registry data via ibantools). The text below explains the domestic identifiers people are asked
 * for. Keep it general and conservative; never list individual branch or routing numbers here.
 */
import { ibanCountryUsage } from "./iban";
import { countryName } from "./iso-countries";

export type DomesticId = { name: string; format: string; use: string };

export type CountryGuide = {
  code: string;
  slug: string;
  currency: string;
  intro: string;
  domestic: DomesticId[];
  receiving: string[];
  tips: string[];
};

export const countryGuides: CountryGuide[] = [
  {
    code: "ZA", slug: "south-africa", currency: "South African rand (ZAR)",
    intro: "South Africa doesn't use IBANs. Payments from abroad need the bank's SWIFT/BIC code and your account number.",
    domestic: [{ name: "Branch code", format: "6 digits", use: "Domestic payments. Most banks publish one universal branch code that works for all their branches." }],
    receiving: ["Your full name as on the account", "Your account number", "Your bank's SWIFT/BIC code", "Your bank's name and address"],
    tips: ["Your bank may ask you to confirm the reason for an incoming foreign payment, because of exchange-control reporting.", "Moving money out of South Africa falls under the Reserve Bank's allowances. See our guide to the single discretionary allowance."],
  },
  {
    code: "ZW", slug: "zimbabwe", currency: "US dollar (USD) and Zimbabwe Gold (ZiG)",
    intro: "Zimbabwe doesn't use IBANs. Incoming international payments use the bank's SWIFT/BIC code and your account number, and usually travel through a correspondent bank.",
    domestic: [{ name: "Account number", format: "Varies by bank", use: "Combined with the bank's name for domestic transfers." }],
    receiving: ["Your full name as on the account", "Your account number", "Your bank's SWIFT/BIC code", "The currency your account receives (USD or ZiG)", "Any correspondent bank details your bank specifies"],
    tips: ["Check which currency the account holds before asking someone to send money: a USD payment into a ZiG account may be converted.", "Many Zimbabwean banks publish separate correspondent-bank instructions for US dollar payments. Ask your bank for them."],
  },
  {
    code: "GB", slug: "united-kingdom", currency: "Pound sterling (GBP)",
    intro: "The UK uses IBANs for international payments. Domestic payments use a sort code and account number.",
    domestic: [{ name: "Sort code", format: "6 digits (e.g. 12-34-56)", use: "Identifies the bank and branch for domestic payments, with an 8-digit account number." }],
    receiving: ["Your IBAN", "Your bank's SWIFT/BIC code", "Your full name as on the account"],
    tips: ["Your IBAN and BIC are usually shown in your banking app or on your statement.", "Some UK banks show different BICs for accounts that moved from another brand. Use the one on your own statement."],
  },
  {
    code: "US", slug: "united-states", currency: "US dollar (USD)",
    intro: "The United States doesn't use IBANs. International wires use the bank's SWIFT/BIC code and your account number; domestic transfers use a routing number.",
    domestic: [{ name: "ABA routing number", format: "9 digits", use: "Domestic wires and ACH transfers. Some banks use a different routing number for wires than for ACH, so check which one applies." }],
    receiving: ["Your account number", "Your bank's SWIFT/BIC code", "Your full name and address", "Sometimes a routing number or intermediary bank, if your bank asks for one"],
    tips: ["Some US banks give different SWIFT codes for US-dollar and foreign-currency wires. Check your bank's wire instructions.", "Not every US account can receive international wires. Confirm with your bank first."],
  },
  {
    code: "CA", slug: "canada", currency: "Canadian dollar (CAD)",
    intro: "Canada doesn't use IBANs. International wires use the bank's SWIFT/BIC code plus your transit, institution and account numbers.",
    domestic: [
      { name: "Institution number", format: "3 digits", use: "Identifies the bank." },
      { name: "Transit number", format: "5 digits", use: "Identifies the branch." },
    ],
    receiving: ["Your account number", "Your transit and institution numbers", "Your bank's SWIFT/BIC code", "Your full name and address"],
    tips: ["Several Canadian banks list intermediary banks for US-dollar and other foreign-currency wires. Use your bank's own wire instructions."],
  },
  {
    code: "AU", slug: "australia", currency: "Australian dollar (AUD)",
    intro: "Australia doesn't use IBANs. Payments from abroad need the bank's SWIFT/BIC code, your BSB and your account number.",
    domestic: [{ name: "BSB", format: "6 digits", use: "Identifies the bank and branch for domestic payments." }],
    receiving: ["Your BSB", "Your account number", "Your bank's SWIFT/BIC code", "Your full name as on the account"],
    tips: ["Some Australian banks use more than one SWIFT code. Use the one your bank gives for your account."],
  },
  {
    code: "DE", slug: "germany", currency: "Euro (EUR)",
    intro: "Germany uses IBANs. For euro payments within the SEPA area the IBAN is usually all you need.",
    domestic: [{ name: "Bankleitzahl (BLZ)", format: "8 digits, built into the IBAN", use: "The old bank code. It now sits inside the German IBAN, so you rarely need it separately." }],
    receiving: ["Your IBAN", "Your full name", "Your bank's BIC, for payments from outside the SEPA area"],
    tips: ["Inside SEPA, a correct IBAN is enough for euro transfers; banks shouldn't require a BIC."],
  },
  {
    code: "FR", slug: "france", currency: "Euro (EUR)",
    intro: "France uses IBANs. French bank details are often shared as a RIB (relevé d'identité bancaire), which shows the IBAN and BIC.",
    domestic: [{ name: "RIB", format: "Bank, branch, account and key, built into the IBAN", use: "A document or set of details used to set up payments in France." }],
    receiving: ["Your IBAN", "Your full name", "Your bank's BIC, for payments from outside the SEPA area"],
    tips: ["Ask for a RIB if you're setting up rent, salary or direct debits in France."],
  },
  {
    code: "AE", slug: "united-arab-emirates", currency: "UAE dirham (AED)",
    intro: "The UAE uses IBANs. The bank code is part of the IBAN, and international payments use the IBAN with the bank's SWIFT/BIC code.",
    domestic: [{ name: "IBAN", format: "23 characters", use: "Used for domestic and international payments." }],
    receiving: ["Your IBAN", "Your bank's SWIFT/BIC code", "Your full name as on the account"],
    tips: ["Your IBAN appears in your banking app and on your account certificate."],
  },
  {
    code: "IN", slug: "india", currency: "Indian rupee (INR)",
    intro: "India doesn't use IBANs. Inward remittances use the bank's SWIFT/BIC code and your account number; domestic transfers use an IFSC.",
    domestic: [{ name: "IFSC", format: "11 characters", use: "Identifies the bank branch for domestic transfers (NEFT, RTGS, IMPS)." }],
    receiving: ["Your account number", "Your bank's SWIFT/BIC code", "Your IFSC, if your bank asks for it", "The purpose of the payment, which Indian banks often require"],
    tips: ["Some Indian banks use different SWIFT codes depending on the amount or the type of remittance. Use your bank's own instructions."],
  },
  {
    code: "NG", slug: "nigeria", currency: "Nigerian naira (NGN)",
    intro: "Nigeria doesn't use IBANs. Incoming international payments use the bank's SWIFT/BIC code and your account number.",
    domestic: [{ name: "NUBAN account number", format: "10 digits", use: "The standard Nigerian account number format, used with the bank's name or code." }],
    receiving: ["Your 10-digit account number", "Your bank's SWIFT/BIC code", "Your full name as on the account", "Correspondent bank details, which many Nigerian banks publish per currency"],
    tips: ["To receive dollars, pounds or euros without conversion, you usually need a foreign-currency (domiciliary) account."],
  },
  {
    code: "GH", slug: "ghana", currency: "Ghanaian cedi (GHS)",
    intro: "Ghana doesn't use IBANs. Payments from abroad use the bank's SWIFT/BIC code and your account number.",
    domestic: [{ name: "Bank and branch code", format: "Varies", use: "Used for domestic transfers; ask your bank for the exact format." }],
    receiving: ["Your account number", "Your bank's SWIFT/BIC code", "Your full name as on the account", "Correspondent bank details if your bank specifies them"],
    tips: ["Our Ghana codes come from a 2017 Bank of Ghana list, so confirm the current code with your bank."],
  },
  {
    code: "KE", slug: "kenya", currency: "Kenyan shilling (KES)",
    intro: "Kenya doesn't use IBANs. International payments use the bank's SWIFT/BIC code and your account number.",
    domestic: [{ name: "Bank and branch codes", format: "Varies", use: "Used for domestic transfers such as EFT and RTGS." }],
    receiving: ["Your account number", "Your bank's SWIFT/BIC code", "Your full name as on the account", "Branch name or code if your bank asks for it"],
    tips: ["Mobile money (such as M-Pesa) uses different details from bank transfers. Check which one the sender is using."],
  },
  {
    code: "BW", slug: "botswana", currency: "Botswana pula (BWP)",
    intro: "Botswana doesn't use IBANs. International payments use the bank's SWIFT/BIC code, your account number and often your branch code.",
    domestic: [{ name: "Branch code", format: "Varies by bank", use: "Identifies the branch for domestic payments." }],
    receiving: ["Your account number", "Your bank's SWIFT/BIC code", "Your branch code", "Your full name as on the account"],
    tips: ["Our FNB Botswana code comes from its 2018 annual report, so confirm it with the bank."],
  },
  {
    code: "ZM", slug: "zambia", currency: "Zambian kwacha (ZMW)",
    intro: "Zambia doesn't use IBANs. International payments use the bank's SWIFT/BIC code and your account number; domestic payments use sort codes.",
    domestic: [{ name: "Sort code", format: "Varies by bank and branch", use: "Identifies the branch for domestic payments. Banks such as Zanaco publish their sort codes." }],
    receiving: ["Your account number", "Your bank's SWIFT/BIC code", "Your branch name or sort code", "Your full name as on the account"],
    tips: ["Ask your bank whether foreign-currency payments go through a correspondent bank."],
  },
];

export function getCountryGuide(slug: string): CountryGuide | undefined {
  return countryGuides.find((c) => c.slug === slug);
}

export function guideForCode(code: string): CountryGuide | undefined {
  return countryGuides.find((c) => c.code === code.toUpperCase());
}

export function ibanSummary(code: string): string {
  const u = ibanCountryUsage(code);
  if (!u.usesIban) return `${countryName(code)} doesn't use IBANs.`;
  return `${countryName(code)} uses IBANs of ${u.length} characters${u.inRegistry ? ", listed in SWIFT's IBAN Registry" : ""}.`;
}
