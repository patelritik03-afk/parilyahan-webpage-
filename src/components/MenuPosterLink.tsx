"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function MenuPosterLink({ date, version }: { date: string; version: number }) {
  const { t } = useLanguage();
  const src = `/api/poster/${date}?v=${version}`;

  return (
    <div className="mt-10 text-center">
      <a
        href={`${src}&download=1`}
        className="inline-block rounded-full border border-primary px-6 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {t("menu.poster")}
      </a>
    </div>
  );
}
