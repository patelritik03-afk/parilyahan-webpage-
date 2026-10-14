import { POSTER_TEXT } from "./poster/constants";
import { PHONE_DISPLAY } from "./site";

// Plain-English pages written for the searches people type into Google ("Filipino buffet Jumeirah",
// "weekend seafood buffet Dubai"). Prices and hours come from the same place as the menu poster so
// they never disagree with it.

export const WEEKDAY_PRICE = POSTER_TEXT.weekday.price;
export const WEEKEND_PRICE = POSTER_TEXT.weekend.price;
export const OPEN_HOURS = "1:00 PM to 10:00 PM";

export type Faq = { q: string; a: string };
export type Section = { heading: string; paragraphs: string[] };
export type SeoPage = {
  slug: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: Section[];
  faqs: Faq[];
};

const FAQ = {
  where: {
    q: "Where is Parilyahan Sa Kalye?",
    a: "We are on the ground floor of the Ibis Styles Hotel on Al Mina Road, at 2nd December Street in Jumeirah 1, Dubai.",
  },
  price: {
    q: "How much is the Filipino buffet?",
    a: `The buffet is AED ${WEEKDAY_PRICE} + taxes per person from Monday to Thursday and AED ${WEEKEND_PRICE} + taxes per person from Friday to Sunday.`,
  },
  halal: {
    q: "Is the food halal?",
    a: "Yes, Parilyahan Sa Kalye is halal certified.",
  },
  hours: {
    q: "What time are you open?",
    a: `We are open every day, ${OPEN_HOURS}.`,
  },
  book: {
    q: "Do I need to book a table?",
    a: `Booking is recommended. You can reserve online on our reservation page, or call or WhatsApp us on ${PHONE_DISPLAY}.`,
  },
  menu: {
    q: "What is on the buffet today?",
    a: "The menu changes every day. Today's full menu, from starters and soup to main course, rice, special dishes, dessert and drinks, is always on our Daily Menu page.",
  },
  bucket: {
    q: "What is the free bucket of seafood?",
    a: "On Friday, Saturday and Sunday the weekend buffet comes with a free bucket of seafood.",
  },
  parking: {
    q: "Is there parking?",
    a: "Yes, we offer free parking.",
  },
  group: {
    q: "Can I book for a large group, birthday or private event?",
    a: "Yes. Send us the date, number of guests and event type on our enquiries page and we will get back to you.",
  },
  tax: {
    q: "Are the prices inclusive of tax?",
    a: `No. Buffet prices are AED ${WEEKDAY_PRICE} + taxes on weekdays and AED ${WEEKEND_PRICE} + taxes on weekends, so taxes are added to the bill.`,
  },
};

export const JUMEIRAH_PAGE: SeoPage = {
  slug: "filipino-buffet-jumeirah",
  metaTitle: "Filipino Buffet in Jumeirah 1, Dubai",
  description: `Halal certified unlimited Filipino buffet at Ibis Styles Hotel, Al Mina Road, Jumeirah 1, Dubai. AED ${WEEKDAY_PRICE} weekdays, AED ${WEEKEND_PRICE} weekends + taxes. Open daily 1 PM to 10 PM, free parking.`,
  eyebrow: "Jumeirah 1, Dubai",
  h1: "Filipino Buffet in Jumeirah, Dubai",
  intro:
    "Parilyahan Sa Kalye serves a halal certified, unlimited Filipino buffet on the ground floor of the Ibis Styles Hotel on Al Mina Road, Jumeirah 1. Home-cooked Filipino street food, grilled meats, seafood, rice dishes and classic sides, with a fresh menu every single day.",
  sections: [
    {
      heading: "Where to find us",
      paragraphs: [
        "We are at the Ibis Styles Hotel, ground floor, on Al Mina Road at 2nd December Street in Jumeirah 1, Dubai. Parking is free.",
      ],
    },
    {
      heading: "Buffet prices and opening hours",
      paragraphs: [
        `Monday to Thursday the buffet is AED ${WEEKDAY_PRICE} + taxes per person. Friday to Sunday it is AED ${WEEKEND_PRICE} + taxes per person and includes a free bucket of seafood.`,
        `We are open every day, ${OPEN_HOURS}, so you can come for a late lunch, an early dinner or anything in between.`,
      ],
    },
    {
      heading: "What is on the Filipino buffet",
      paragraphs: [
        "There is no fixed menu. We cook a new buffet every day, so regulars always find something different. A typical day covers starters, soup, salad, noodles, main course, rice, special dishes, dessert and drinks.",
        "Check today's menu on our Daily Menu page before you come.",
      ],
    },
    {
      heading: "Book your table",
      paragraphs: [
        `Reserve online in a minute, or call or WhatsApp us on ${PHONE_DISPLAY}. For birthdays, groups and private events, send us an enquiry with your date and the number of guests.`,
      ],
    },
  ],
  faqs: [FAQ.where, FAQ.price, FAQ.halal, FAQ.hours, FAQ.parking, FAQ.menu, FAQ.book],
};

export const WEEKEND_PAGE: SeoPage = {
  slug: "weekend-seafood-buffet-dubai",
  metaTitle: `Weekend Seafood and Filipino Buffet in Dubai, AED ${WEEKEND_PRICE}`,
  description: `Friday to Sunday halal certified Filipino buffet with a free bucket of seafood at Parilyahan Sa Kalye, Jumeirah 1, Dubai. AED ${WEEKEND_PRICE} + taxes per person. Open 1 PM to 10 PM.`,
  eyebrow: "Friday to Sunday",
  h1: "Weekend Seafood & Filipino Buffet in Dubai",
  intro: `Every Friday, Saturday and Sunday, Parilyahan Sa Kalye serves its full halal certified, unlimited Filipino buffet for AED ${WEEKEND_PRICE} + taxes per person, and every weekend table gets a free bucket of seafood.`,
  sections: [
    {
      heading: "What the weekend buffet includes",
      paragraphs: [
        "The weekend buffet is our regular daily spread of Filipino street food, grilled meats, rice dishes, noodles, soup, salad, special dishes, dessert and drinks, plus a free bucket of seafood.",
        "The dishes change every day, so each weekend is a little different. See the Daily Menu page for what is being served.",
      ],
    },
    {
      heading: "Weekend price and timings",
      paragraphs: [
        `Friday to Sunday: AED ${WEEKEND_PRICE} + taxes per person. Open ${OPEN_HOURS}.`,
        `Monday to Thursday the same buffet is AED ${WEEKDAY_PRICE} + taxes per person, without the free seafood bucket.`,
      ],
    },
    {
      heading: "Find us in Jumeirah 1",
      paragraphs: [
        "We are on the ground floor of the Ibis Styles Hotel on Al Mina Road at 2nd December Street, Jumeirah 1, Dubai. Parking is free.",
        "Please book your table ahead online, or call or WhatsApp us.",
      ],
    },
  ],
  faqs: [FAQ.bucket, FAQ.price, FAQ.tax, FAQ.halal, FAQ.hours, FAQ.book, FAQ.group],
};

export const FAQ_PAGE: SeoPage = {
  slug: "faq",
  metaTitle: "Questions About Our Filipino Buffet in Dubai",
  description: `Halal, prices, opening hours, location, parking and booking for the Parilyahan Sa Kalye Filipino buffet in Jumeirah 1, Dubai. AED ${WEEKDAY_PRICE} weekdays, AED ${WEEKEND_PRICE} weekends + taxes.`,
  eyebrow: "Good to know",
  h1: "Frequently Asked Questions",
  intro:
    "Everything people ask us before visiting Parilyahan Sa Kalye, the unlimited Filipino buffet in Jumeirah 1, Dubai.",
  sections: [],
  faqs: [
    FAQ.price,
    FAQ.tax,
    FAQ.halal,
    FAQ.hours,
    FAQ.where,
    FAQ.parking,
    FAQ.book,
    FAQ.menu,
    FAQ.bucket,
    FAQ.group,
    {
      q: "What kind of food do you serve?",
      a: "Halal certified, home-cooked Filipino street food as an unlimited buffet: grilled meats, seafood, rice dishes, noodles and classic sides, with a different menu every day.",
    },
  ],
};

export const SEO_PAGES = [JUMEIRAH_PAGE, WEEKEND_PAGE, FAQ_PAGE];
