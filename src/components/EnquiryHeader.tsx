"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import PageBanner from "./PageBanner";

export default function EnquiryHeader() {
  const { t } = useLanguage();

  return (
    <PageBanner image="/images/hero-buffet.webp">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-accent">
        {t("enquiry.eyebrow")}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">{t("enquiry.title")}</h1>
      <p className="mt-3 max-w-xl text-white/80">{t("enquiry.subtitle")}</p>
    </PageBanner>
  );
}
