// Fixed geometry of the daily menu poster (1080x1920, a standard portrait screen / story size).
export const POSTER_W = 1080;
export const POSTER_H = 1920;

export const PAD = 36;
export const FOOTER_H = 150;
export const BODY_BOTTOM_GAP = 20;
export const COL_GAP = 24;

export const LEFT_W = 424;
export const RIGHT_W = POSTER_W - 2 * PAD - LEFT_W - COL_GAP;
export const CONTENT_H = POSTER_H - FOOTER_H - PAD - BODY_BOTTOM_GAP;

// Must match scripts/prepare-poster-assets.mjs
// The weekend poster has the free-seafood banner, so its picture collage is shorter than the weekday one.
export const COLLAGE_W = 424;
export const COLLAGE_H_WEEKEND = 840;
export const COLLAGE_H_WEEKDAY = 956;

export const LOGO_W = 430;
export const LOGO_H = Math.round((LOGO_W * 377) / 900);
export const DATE_H = 80;

export const CARD_BORDER = 3;
export const CARD_PAD = 20;
export const COLUMN_GAP = 24;
export const CARD_H = CONTENT_H - (LOGO_H + 10 + DATE_H + 18);
export const CARD_INNER_W = RIGHT_W - 2 * CARD_BORDER - 2 * CARD_PAD;
export const CARD_INNER_H = CARD_H - 2 * CARD_BORDER - 2 * CARD_PAD;
export const COLUMN_W = Math.floor((CARD_INNER_W - COLUMN_GAP) / 2);

export const RED = "#c1121f";
export const DARK = "#161616";
export const YELLOW = "#ffd23f";
export const INK = "#1c1c1c";

// The left side of the poster never changes. Edit the wording or prices here.
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
