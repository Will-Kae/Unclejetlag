export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
export const SHOW_AD_PLACEHOLDERS = process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS === "true";
export type AdPosition = "after-intro" | "mid-article" | "end-of-article" | "sidebar";
export const AD_SLOTS: Record<AdPosition, string | undefined> = {
  "after-intro": process.env.NEXT_PUBLIC_ADSENSE_SLOT_AFTER_INTRO,
  "mid-article": process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID_ARTICLE,
  "end-of-article": process.env.NEXT_PUBLIC_ADSENSE_SLOT_END_ARTICLE,
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
};
