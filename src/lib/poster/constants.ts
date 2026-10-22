// Fixed geometry of the daily menu poster (1080x1920, a standard portrait screen / story size).
export const POSTER_W = 1080;
export const POSTER_H = 1920;
export const MARGIN = 40;
export const INNER_W = POSTER_W - 2 * MARGIN;

// Photo at the top. Must match scripts/prepare-poster-assets.mjs (pictures are 1080x640, shown cropped).
export const HERO_H = 560;
export const HERO_IMG_H = 640;
export const LOGO_W = 300;
export const LOGO_H = Math.round((LOGO_W * 377) / 900);

// Price cards overlap the bottom of the photo.
export const PRICE_TOP = 500;
export const PRICE_H = 170;
export const PRICE_GAP = 24;
export const PRICE_W = (INNER_W - PRICE_GAP) / 2;
export const VAT_TOP = PRICE_TOP + PRICE_H + 12;
export const VAT_H = 30;
export const CONTENT_TOP = VAT_TOP + VAT_H + 12;

// Weekend-only "free bucket seafoods" banner.
export const BUCKET_H = 90;
export const BUCKET_GAP = 18;
export const BADGE = 112;

export const FOOTER_H = 160;
export const MENU_BOTTOM = POSTER_H - FOOTER_H - 24;
export const MENU_BORDER = 2;
export const MENU_PAD_X = 28;
export const MENU_PAD_Y = 24;
export const MENU_HEADING_H = 54;
export const MENU_INNER_W = INNER_W - 2 * MENU_BORDER - 2 * MENU_PAD_X;

export function menuTop(weekend: boolean) {
  return weekend ? CONTENT_TOP + BUCKET_H + BUCKET_GAP : CONTENT_TOP;
}

// Space the menu sections can use, inside the card and below its heading.
export function menuBox(weekend: boolean) {
  const cardH = MENU_BOTTOM - menuTop(weekend);
  return { width: MENU_INNER_W, height: cardH - 2 * MENU_BORDER - 2 * MENU_PAD_Y - MENU_HEADING_H };
}

export const RED = "#c1121f";
export const DARK = "#171311";
export const YELLOW = "#ffd23f";
export const INK = "#211a16";
export const MUTED = "#6e6259";
export const CREAM = "#fff6e8";
export const LINE = "#f0dfc6";

// The fixed wording of the poster. Edit the wording or prices here.
export const POSTER_TEXT = {
  tagline: "A Feast of Asian & Global Flavors",
  weekday: { price: "39", days: "MONDAY - THURSDAY", hours: "1:00PM - 10:00PM", label: "WEEKDAYS" },
  weekend: { price: "59", days: "FRIDAY - SUNDAY", hours: "1:00PM - 10:00PM", label: "WEEKENDS" },
  vat: "*Prices are subject to an additional 5% VAT & TAX*",
  freeBucket: "FREE BUCKET SEAFOODS",
  callLabel: "CALL US FOR RESERVATION",
  phones: "056 3641 028 / (04) 352 1855",
  addressLine1: "Ibis Styles Hotel, Al Mina Road",
  addressLine2: "2nd December St., Jumeirah 1, Dubai",
  parkingTop: "FREE",
  parkingBottom: "PARKING",
};
