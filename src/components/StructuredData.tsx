import { SITE_URL } from "@/lib/siteUrl";
import {
  CONTACT_EMAIL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  MAPS_URL,
  PHONE_TEL,
  TIKTOK_URL,
} from "@/lib/site";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Tells Google (in its own format) that this site is a restaurant, where it is, when it is open
// and how to book, so it can show rich results and place the business correctly in Dubai searches.
export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE_URL}/#restaurant`,
    name: "Parilyahan Sa Kalye",
    description:
      "Halal certified, home-cooked Filipino street food served as an unlimited daily buffet in Dubai, with a fresh menu every day.",
    url: SITE_URL,
    image: [`${SITE_URL}/images/hero-buffet.webp`, `${SITE_URL}/images/hero-atrium.webp`],
    logo: `${SITE_URL}/brand/logo.png`,
    telephone: PHONE_TEL,
    email: CONTACT_EMAIL,
    servesCuisine: ["Filipino", "Asian", "Buffet"],
    priceRange: "AED 39 - AED 59",
    acceptsReservations: `${SITE_URL}/reservation`,
    hasMenu: `${SITE_URL}/menu`,
    hasMap: MAPS_URL,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ibis Styles Hotel, Ground Floor, Al Mina Road - 2nd December St - Jumeirah 1",
      addressLocality: "Dubai",
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: DAYS, opens: "13:00", closes: "22:00" },
    ],
    sameAs: [INSTAGRAM_URL, FACEBOOK_URL, TIKTOK_URL],
  };

  return (
    <script
      type="application/ld+json"
      // "<" is escaped so the data can never close the script tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
