"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { todayISO } from "@/lib/date";
import PageBanner from "./PageBanner";

export default function MenuDateHeader({ date }: { date: string }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [selected, setSelected] = useState(date);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(`/menu?date=${selected}`);
  }

  const isToday = date === todayISO();
  const displayDate = new Date(`${date}T00:00:00`).toLocaleDateString(lang === "tl" ? "fil-PH" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <PageBanner image="/images/hero-buffet.webp">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-accent">
        {isToday ? `${t("menu.today")} - ${displayDate}` : displayDate}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">{t("menu.title")}</h1>
      <p className="mt-3 max-w-xl text-white/80">{t("menu.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-white/80" htmlFor="menu-date-picker">
            {t("menu.pickDate")}
          </label>
          <input
            id="menu-date-picker"
            type="date"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-1 rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark] focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {t("menu.viewMenu")}
        </button>
      </form>
    </PageBanner>
  );
}
