"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SPIN_TEXT, type PublicCampaign } from "@/lib/spin/text";
import Wheel from "./Wheel";

// Big Spin & Win block on the home page (only while a campaign is switched on with the banner).
export default function SpinPromo({ campaign }: { campaign: PublicCampaign | null }) {
  const { lang } = useLanguage();
  if (!campaign?.banner || campaign.prizes.length === 0) return null;
  const T = SPIN_TEXT[lang];
  const jackpots = campaign.prizes.filter((p) => p.is_jackpot);
  const date = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(lang === "tl" ? "fil-PH" : "en-GB", { day: "numeric", month: "long" });

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(255,215,0,0.25), transparent 55%), linear-gradient(135deg, #7a0d14 0%, #3b0a0e 50%, #14213d 100%)" }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_1fr]">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">{T.eyebrow}</p>
          <h2
            className="mt-2 text-5xl font-black leading-none tracking-tight sm:text-6xl"
            style={{
              background: "linear-gradient(180deg,#fff7c2 0%,#ffd700 45%,#e09b00 100%)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 4px 0 rgba(90,26,0,0.8))",
            }}
          >
            {T.title}
          </h2>
          <p className="mt-4 text-lg font-semibold">{T.subtitle}</p>
          <ul className="mt-5 space-y-2 text-left">
            {jackpots.map((p) => (
              <li key={p.position} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 font-semibold ring-1 ring-amber-300/40">
                <span className="text-2xl">{p.emoji}</span>
                {lang === "tl" ? p.label_tl : p.label_en}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col items-center gap-2 md:items-start">
            <Link
              href="/spin?src=website"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#ffe27a] to-[#f2b705] px-10 py-4 text-xl font-black uppercase tracking-wide text-[#5a1a00] shadow-[0_6px_0_#a86f00,0_14px_30px_rgba(0,0,0,0.35)] transition active:translate-y-1"
            >
              {campaign.running ? `${T.bannerCta} 🎡` : `${T.prizesTitle} 🎡`}
            </Link>
            <p className="text-sm text-white/70">
              {campaign.running ? `${T.endsOn} ${date(campaign.ends_on)}` : `${T.startsOn} ${date(campaign.starts_on)}`}
            </p>
          </div>
        </div>
        <Link href="/spin?src=website" aria-label={T.title} className="mx-auto block w-full max-w-[340px]">
          <Wheel prizes={campaign.prizes} lang={lang} idle />
        </Link>
      </div>
    </section>
  );
}
