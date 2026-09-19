export const PHONE_DISPLAY = "+971 56 364 1028";
export const PHONE_TEL = "+971563641028";
export const WHATSAPP_NUMBER = "971563641028";
export const CONTACT_EMAIL = "parilyahansakalye@gmail.com";

export const ADDRESS_LINES = [
  "Parilyahan sa Kalye",
  "Ibis Styles Hotel, Ground Floor",
  "Al Mina Road - 2nd December St - Jumeirah 1",
  "Dubai",
];

export const ADDRESS_ONE_LINE =
  "Parilyahan sa Kalye, Ibis Styles Hotel, Ground Floor, Al Mina Road - 2nd December St - Jumeirah 1 - Dubai";

// Opens the place in Google Maps (with directions) from the street address.
export const MAPS_URL =
  process.env.NEXT_PUBLIC_MAPS_URL ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_ONE_LINE)}`;

// The restaurant's Google business listing (shows reviews and the "Write a review" button).
export const GOOGLE_LISTING_URL =
  process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "https://share.google/AcPdQnB73LbaYcaZ2";

export const PLACE_SEARCH_QUERY = "Parilyahan sa Kalye Ibis Styles Hotel Al Mina Road Jumeirah 1 Dubai";
