"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SPIN_TEXT } from "@/lib/spin/text";
import { useSpinCampaign } from "./useSpinCampaign";

const HIDDEN_ON = ["/spin", "/admin", "/stock"];

// Small spinning wheel in the corner of every public page while the contest runs.
export default function SpinFloatingButton() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const campaign = useSpinCampaign();
  if (!campaign || HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return (
    <Link
      href="/spin?src=float"
      aria-label={SPIN_TEXT[lang].title}
      className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-gradient-to-b from-[#ffe27a] to-[#f2b705] py-2 pl-2 pr-4 font-black uppercase text-[#5a1a00] shadow-[0_5px_0_#a86f00,0_12px_28px_rgba(0,0,0,0.35)] ring-2 ring-[#c1121f] transition hover:scale-105"
    >
      <span className="inline-block animate-[spin_5s_linear_infinite] text-3xl leading-none motion-reduce:animate-none" aria-hidden>
        🎡
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm">{SPIN_TEXT[lang].floatCta} ✈️</span>
        <span className="text-[10px] font-bold normal-case opacity-80">Spin &amp; Win</span>
      </span>
    </Link>
  );
}
