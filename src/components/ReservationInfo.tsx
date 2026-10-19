"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { WEEKDAY_PRICE, WEEKEND_PRICE } from "@/lib/seoPages";
import { WHATSAPP_NUMBER } from "@/lib/site";

// Shown above the booking form: many visitors land here straight from a social post and have
// not seen the prices or opening hours yet.
export default function ReservationInfo() {
  const { t } = useLanguage();
  const prices = t("reservation.infoPrices").replace("{weekday}", WEEKDAY_PRICE).replace("{weekend}", WEEKEND_PRICE);
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t("reservation.whatsappText"))}`;

  return (
    <div className="mb-8 rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed">
      <p className="font-semibold">{prices}</p>
      <p className="mt-1 text-foreground/80">{t("reservation.infoBucket")}</p>
      <p className="mt-1 text-foreground/80">{t("reservation.infoDetails")}</p>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block rounded-full border border-border px-4 py-2 font-semibold text-primary hover:border-primary"
      >
        {t("reservation.whatsapp")}
      </a>
    </div>
  );
}
