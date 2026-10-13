/** Direct URL emitted by DiscoverCars' official loader and verified in the Phase 3A audit.
 * Keep attribution in the frame URL: the provider converts aff_code/aff_value into a_aid on search.
 * No provider loader needs to execute in the parent document.
 */
export const DISCOVERCARS_FRAME_TITLE = "DiscoverCars car rental search";
const PARAMS: Record<string, string> = {
  "currency": "usd",
  "pickup_from": "",
  "pickup_to": "",
  "utm_source": "unclejetlag",
  "utm_medium": "widget",
  "aff_code": "a_aid",
  "aff_value": "unclejetlag",
  "aff_channel": "",
  "aff_data1": "",
  "aff_data2": "",
  "tspc": "",
  "autocomplete": "on",
  "style_form_bg_color": "#ffffff",
  "style_form_font_color": "#101c30",
  "style_submit_bg_color": "#101c30",
  "style_submit_font_color": "#ffffff",
  "submit_text": "Search now",
  "title_text": "Uncle's search and compare car rentals and save up to 70%!",
  "style_title_color": "#101c30",
  "layout_benefits": "on",
  "layout_description": "on",
  "layout_description_text": "Uncle Jetlag has selected the best deals from our car rental partners.",
  "layout_logo_style": "on dark",
  "layout_powered_by": "",
  "layout_style_form_bg_color": "#101c30",
  "layout_title": "on",
  "layout_top_logo": "on",
  "layout_supplier_logos": "on",
  "responsive": "on",
  "localization_currency_box": "on"
};

export function discoverCarsFrameUrl(origin: string): string {
  const url = new URL("https://widget.discovercars.com/locations/");
  url.search = new URLSearchParams({ ...PARAMS, widget_origin: origin }).toString();
  return url.toString();
}
