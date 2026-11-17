"use client";

import { SPIN_TEXT, type SpinLang } from "@/lib/spin/text";

// The jackpot prize as a gold boarding pass: the headline of the whole contest.
export default function TicketCallout({ lang, size = "md" }: { lang: SpinLang; size?: "md" | "lg" }) {
  const T = SPIN_TEXT[lang];
  const big = size === "lg";
  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      <div
        className="relative flex overflow-hidden rounded-2xl text-[#14213d] shadow-[0_14px_36px_rgba(0,0,0,0.45)] ring-2 ring-amber-200"
        style={{ background: "linear-gradient(135deg,#fff7c2 0%,#ffd700 45%,#f2b705 100%)" }}
      >
        {/* Shine sweeping across the ticket */}
        <span aria-hidden className="psk-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/50 blur-sm" />
        <div className="flex-1 p-4 text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#c1121f]">★ {T.ticketBadge} ★</p>
          <p className={`mt-1 font-black uppercase leading-[1.05] ${big ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{T.ticketTitle}</p>
          <p className="mt-2 flex items-center gap-2 font-mono text-sm font-bold tracking-widest">
            DXB <span className="text-[#c1121f]">✈︎ · · · · ·</span> PH
          </p>
        </div>
        {/* Tear-off stub */}
        <div className="relative flex w-24 flex-col items-center justify-center border-l-2 border-dashed border-[#14213d]/30 bg-[#14213d] px-2 text-center text-amber-200">
          <span aria-hidden className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#3b0a0e]" />
          <span aria-hidden className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-[#3b0a0e]" />
          <span className={`${big ? "text-5xl" : "text-4xl"} leading-none`} aria-hidden>
            ✈️
          </span>
          <span className="mt-1 text-[10px] font-black uppercase leading-tight">{T.ticketStub}</span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-white/70">{T.ticketNote}</p>
      <style>{`
        .psk-shine { animation: psk-shine 3.2s ease-in-out infinite; }
        @keyframes psk-shine { 0% { left: -50%; } 60%, 100% { left: 130%; } }
        @media (prefers-reduced-motion: reduce) { .psk-shine { animation: none; display: none; } }
      `}</style>
    </div>
  );
}
