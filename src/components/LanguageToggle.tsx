"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  const buttonClass = (active: boolean) =>
    `rounded-full px-2.5 py-1 transition-colors ${
      active ? "bg-primary text-primary-foreground" : "text-header-foreground/70 hover:text-header-foreground"
    }`;

  return (
    <div className="flex items-center rounded-full border border-white/25 text-xs font-semibold">
      <button type="button" onClick={() => setLang("en")} aria-pressed={lang === "en"} className={buttonClass(lang === "en")}>
        EN
      </button>
      <button type="button" onClick={() => setLang("tl")} aria-pressed={lang === "tl"} className={buttonClass(lang === "tl")}>
        TL
      </button>
    </div>
  );
}
