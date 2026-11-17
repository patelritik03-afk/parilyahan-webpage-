"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SPIN_TEXT, type PublicCampaign } from "@/lib/spin/text";

const DISMISS_KEY = "psk_spin_banner_closed";
const HIDDEN_ON = ["/spin", "/admin", "/stock"];

// Slim strip above the header on every public page while the contest is running.
export default function SpinBanner() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [closed, setClosed] = useState(false);
  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (hidden) return;
    try {
      // Closed earlier in this visit: don't even ask the server.
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // storage blocked: just show it
    }
    let stop = false;
    fetch("/api/spin/campaign")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !stop && d?.campaign && setCampaign(d.campaign))
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [hidden]);

  if (hidden || closed || !campaign?.running || !campaign.banner) return null;
  const T = SPIN_TEXT[lang];

  return (
    <div className="relative bg-gradient-to-r from-[#7a0d14] via-[#c1121f] to-[#7a0d14] text-white">
      <Link
        href="/spin?src=banner"
        className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-10 py-2 text-center text-sm font-bold sm:gap-3"
      >
        <span className="inline-block animate-[spin_6s_linear_infinite] text-lg motion-reduce:animate-none" aria-hidden>
          🎡
        </span>
        <span className="hidden sm:inline">{T.bannerText}</span>
        <span className="sm:hidden">{T.bannerShort}</span>
        <span className="shrink-0 rounded-full bg-gradient-to-b from-[#ffe27a] to-[#f2b705] px-3 py-0.5 text-xs font-black uppercase text-[#5a1a00]">
          {T.bannerCta} →
        </span>
      </Link>
      <button
        type="button"
        aria-label={T.close}
        onClick={() => {
          setClosed(true);
          try {
            sessionStorage.setItem(DISMISS_KEY, "1");
          } catch {
            // ignore
          }
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-white/80 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
