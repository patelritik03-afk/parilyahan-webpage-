"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Offer } from "@/lib/offers";

function CakeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c.9 1 1.4 1.8 1.4 2.5a1.4 1.4 0 0 1-2.8 0C10.6 4.8 11.1 4 12 3Z" />
      <path d="M12 8v3M4 15a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0v-1a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v1Z" />
      <path d="M5 21h14M5 17v4M19 17v4" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13" />
      <path d="M12 8C10 8 7.5 7.5 7.5 5.5S10 3 12 8Zm0 0c2 0 4.5-.5 4.5-2.5S14 3 12 8Z" />
    </svg>
  );
}

// Offers with a price of 0 are freebies (e.g. the birthday treat): shown as a celebratory banner, not a price card.
function FreeOfferBanner({ offer, freeLabel }: { offer: Offer; freeLabel: string }) {
  const isBirthday = /birthday|bday/i.test(offer.title);
  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#8f0b21] p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20" />
      <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-white/10" />
      <div className="relative flex flex-col items-center gap-5 text-center md:flex-row md:gap-8 md:text-left">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent text-header shadow-md">
          {isBirthday ? <CakeIcon /> : <GiftIcon />}
        </span>
        <div className="flex-1">
          <h3 className="font-display text-2xl font-bold sm:text-3xl">{offer.title}</h3>
          {offer.note && (
            <p className="mt-1 font-display text-sm font-semibold uppercase tracking-wide text-accent sm:text-base">
              {offer.note}
            </p>
          )}
          {offer.description && <p className="mt-3 max-w-2xl text-white/90">{offer.description}</p>}
        </div>
        <div className="shrink-0 rounded-2xl bg-accent px-8 py-3 text-header shadow-md">
          <span className="block font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
            {freeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OffersSection({ offers }: { offers: Offer[] }) {
  const { t } = useLanguage();
  if (offers.length === 0) return null;

  const priced = offers.filter((offer) => offer.price > 0);
  const free = offers.filter((offer) => offer.price <= 0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
          {t("offers.eyebrow")}
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold">{t("offers.title")}</h2>
      </div>

      {priced.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {priced.map((offer) => (
            <div
              key={offer.id}
              className={`w-full rounded-2xl border border-border bg-surface p-6 text-center sm:w-[calc(50%-12px)] ${
                priced.length >= 3 ? "lg:w-[calc(33.333%-16px)]" : ""
              }`}
            >
              <h3 className="font-display text-lg font-semibold">{offer.title}</h3>
              <p className="mt-3 font-display text-4xl font-bold text-primary">AED {offer.price}</p>
              {offer.note && <p className="mt-1 text-xs text-muted">{offer.note}</p>}
              {offer.description && <p className="mt-3 text-sm text-foreground/80">{offer.description}</p>}
            </div>
          ))}
        </div>
      )}

      {free.map((offer) => (
        <FreeOfferBanner key={offer.id} offer={offer} freeLabel={t("offers.free")} />
      ))}
    </section>
  );
}
