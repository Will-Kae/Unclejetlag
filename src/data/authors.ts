import { site } from "./site";
export type Author = {
  slug: string;
  /** Byline name (pen name). */
  name: string;
  /** Real name, used in Person schema so searches for it find the author. */
  legalName?: string;
  role: string;
  shortBio: string;
  bio: string[];
  avatarInitials: string;
  expertise: string[];
  sameAs: string[];
};

export const authors: Record<string, Author> = {
  "uncle-jetlag": {
    slug: "uncle-jetlag",
    name: "Uncle Jetlag",
    legalName: "Willard Munyaradzi Kachere",
    role: "Founder, editor-in-chief & chief border-crosser",
    avatarInitials: "UJ",
    shortBio:
      "The pen name of founder Willard Munyaradzi Kachere: the relative who has already made the expensive mistake so you don't have to. Uncle Jetlag reads the fine print on visas, cards and data plans, then explains it like a human.",
    bio: [
      "Uncle Jetlag is the pen name of Willard Munyaradzi Kachere, the founder and editor of this publication. Under Willard, Uncle Jetlag is independent, practical and written for travellers who are usually an afterthought, including African passport holders.",
      "Willard Munyaradzi Kachere also founded QeFX, the currency converter Uncle Jetlag uses as its official converter.",
      "Uncle Jetlag is the editorial voice of this publication: the well-travelled relative who has queued at the wrong immigration desk, paid the bad exchange rate and bought the useless adapter, and now takes it personally when you do.",
      "Every guide starts from the same question: what does a real traveller need to know before they land? That means reading official government sources, card-network rules and provider terms, then turning them into plain, practical advice.",
      "Uncle Jetlag does not sell visas, give legal or financial advice, or pretend rules never change. Where something must be verified with an embassy or bank, the guide says so. Loudly.",
    ],
    expertise: ["Visas & entry requirements", "Travel money & banking", "eSIMs & connectivity", "Travel from African passports"],
    sameAs: Object.values(site.social),
  },
};

export function getAuthor(slug: string): Author {
  return authors[slug] ?? authors["uncle-jetlag"];
}
