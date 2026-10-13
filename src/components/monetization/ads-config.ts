export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-6434910360613331";

/**
 * Release switch (Phase 3A). AdSense stays OFF for this release, in every consent state, even when
 * NEXT_PUBLIC_ADSENSE_CLIENT is set: serving AdSense to EEA/UK visitors needs a Google-certified
 * CMP (IAB TCF), which is planned for Phase 3B. To re-enable later, set this to true in the same
 * change that adds the certified CMP. The integration (script, ad slots, ads.txt) is kept intact.
 */
export const ADSENSE_RELEASE_ENABLED = false;

/** Whether AdSense may run at all in this build (before consent is considered). */
/** Separate release gate: only set true after certified CMP + live TCF and withdrawal tests pass. */
export const ADSENSE_CMP_VERIFIED = false;
export const ADSENSE_ACTIVE = ADSENSE_RELEASE_ENABLED && ADSENSE_CMP_VERIFIED && Boolean(ADSENSE_CLIENT);
export const SHOW_AD_PLACEHOLDERS = process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS === "true";
export type AdPosition = "after-intro" | "mid-article" | "end-of-article" | "sidebar";
export const AD_SLOTS: Record<AdPosition, string | undefined> = {
  "after-intro": process.env.NEXT_PUBLIC_ADSENSE_SLOT_AFTER_INTRO,
  "mid-article": process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID_ARTICLE,
  "end-of-article": process.env.NEXT_PUBLIC_ADSENSE_SLOT_END_ARTICLE,
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
};
