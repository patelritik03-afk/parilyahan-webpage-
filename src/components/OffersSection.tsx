"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Offer } from "@/lib/offers";

export default function OffersSection({ offers }: { offers: Offer[] }) {
  const { t } = useLanguage();
  if (offers.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
          {t("offers.eyebrow")}
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold">{t("offers.title")}</h2>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-2xl border border-border bg-surface p-6 text-center">
            <h3 className="font-display text-lg font-semibold">{offer.title}</h3>
            <p className="mt-3 font-display text-4xl font-bold text-primary">
              AED {offer.price}
            </p>
            {offer.note && <p className="mt-1 text-xs text-muted">{offer.note}</p>}
            {offer.description && <p className="mt-3 text-sm text-foreground/80">{offer.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
