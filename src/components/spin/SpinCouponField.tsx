"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SPIN_TEXT, formatCouponCode, type PublicCampaign } from "@/lib/spin/text";
import { inputClass, labelClass } from "../FormField";

type Check = { valid: boolean; status?: "active" | "redeemed" | "expired"; prize?: { emoji: string; short_en: string; short_tl: string } | null };

// Optional "Have a Spin & Win code?" on the reservation form (filled in automatically from ?coupon=).
export function SpinCouponField() {
  const { lang } = useLanguage();
  const T = SPIN_TEXT[lang];
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [check, setCheck] = useState<Check | null>(null);

  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("coupon");
    if (fromLink) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the link the winner tapped
      setOpen(true);
      setValue(fromLink.toUpperCase());
    }
  }, []);

  useEffect(() => {
    const code = formatCouponCode(value);
    if (!code) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the result while typing
      setCheck(null);
      return;
    }
    let stop = false;
    const t = setTimeout(() => {
      fetch(`/api/spin/coupon?code=${encodeURIComponent(code)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !stop && d && setCheck(d))
        .catch(() => {});
    }, 400);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [value]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
        🎡 {T.couponQuestion}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 dark:bg-amber-950/20">
      <label className={labelClass} htmlFor="coupon_code">
        🎡 {T.couponQuestion}
      </label>
      <input
        id="coupon_code"
        name="coupon_code"
        type="text"
        autoComplete="off"
        placeholder={T.couponPlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase().slice(0, 20))}
        className={`${inputClass} font-mono uppercase tracking-wider`}
      />
      {check && (
        <p className={`mt-2 text-sm font-semibold ${check.valid ? "text-green-700" : "text-red-600"}`}>
          {check.valid
            ? `✅ ${T.couponOk}: ${check.prize?.emoji ?? ""} ${lang === "tl" ? check.prize?.short_tl : check.prize?.short_en}`
            : check.status === "redeemed"
              ? T.couponUsed
              : check.status === "expired"
                ? T.couponExpired
                : T.couponUnknown}
        </p>
      )}
      <p className="mt-1 text-xs text-muted">{T.couponNote}</p>
    </div>
  );
}

// After a booking: invite the guest to spin (only while the contest is running).
export function SpinInvite() {
  const { lang } = useLanguage();
  const T = SPIN_TEXT[lang];
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);

  useEffect(() => {
    fetch("/api/spin/campaign")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.campaign && setCampaign(d.campaign))
      .catch(() => {});
  }, []);

  if (!campaign?.running) return null;
  return (
    <div
      className="mt-6 rounded-2xl p-5 text-center text-white"
      style={{ background: "linear-gradient(135deg, #7a0d14 0%, #3b0a0e 55%, #14213d 100%)" }}
    >
      <p className="text-4xl">🎡</p>
      <p className="mt-2 font-semibold">{T.afterBooking}</p>
      <Link
        href="/spin?src=reservation"
        className="mt-4 inline-flex rounded-full bg-gradient-to-b from-[#ffe27a] to-[#f2b705] px-8 py-3 font-black uppercase text-[#5a1a00] shadow-[0_5px_0_#a86f00]"
      >
        {T.afterBookingCta}
      </Link>
    </div>
  );
}
