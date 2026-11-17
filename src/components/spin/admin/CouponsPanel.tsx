"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtDate, fmtDateTime } from "./shared";

type Coupon = {
  id: string;
  code: string;
  won_at: string;
  expires_on: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  whatsapp_sent: boolean;
  seen_at: string | null;
  reservation_id: string | null;
  status: "active" | "redeemed" | "expired";
  spin_customers: { full_name: string; phone: string } | null;
  spin_players: { source: string | null; kiosk: boolean } | null;
  spin_prizes: { emoji: string; short_en: string; label_en: string; is_jackpot: boolean } | null;
};

const field = "rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";
const STATUS_TONE = {
  active: "bg-green-100 text-green-800",
  redeemed: "bg-blue-100 text-blue-800",
  expired: "bg-border/60 text-muted",
};

export default function CouponsPanel({ canUndo }: { canUndo: boolean }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQuery(new URLSearchParams({ q, status }).toString()), 300);
    return () => clearTimeout(t);
  }, [q, status]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/spin/coupons?${query}`);
    const json = await res.json().catch(() => ({}));
    if (res.ok) setCoupons(json.coupons);
    else setMessage({ ok: false, text: json.error ?? "Could not load." });
  }, [query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reloads when the search changes
    load();
  }, [load]);

  // Opening the list counts as "seen", which clears the red badge.
  useEffect(() => {
    fetch("/api/admin/spin/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "seen" }) }).catch(() => {});
  }, []);

  async function act(c: Coupon, action: "redeem" | "undo") {
    const who = c.spin_customers?.full_name ?? "this guest";
    const ok = action === "redeem" ? confirm(`Mark ${c.code} (${c.spin_prizes?.short_en}) for ${who} as USED?`) : confirm(`Undo the redemption of ${c.code}?`);
    if (!ok) return;
    setBusy(c.id);
    setMessage(null);
    const res = await fetch("/api/admin/spin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id: c.id }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy("");
    setMessage(res.ok ? { ok: true, text: action === "redeem" ? `${c.code} marked as used ✅` : "Redemption undone." } : { ok: false, text: json.error ?? "Could not save." });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          className={`${field} min-w-0 flex-1`}
          placeholder="Search code (PSK-…), name or mobile"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Not used yet</option>
          <option value="redeemed">Used</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      {message && <p className={`mt-3 text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}

      {!coupons ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : coupons.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">No coupons found.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {coupons.map((c) => {
            const isNew = !c.seen_at;
            return (
              <li
                key={c.id}
                className={`rounded-2xl border bg-surface p-4 ${c.spin_prizes?.is_jackpot ? "border-amber-400 shadow-[0_0_0_2px_rgba(212,160,23,0.25)]" : "border-border"}`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span className="text-3xl leading-none">{c.spin_prizes?.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{c.spin_prizes?.short_en}</span>
                      {c.spin_prizes?.is_jackpot && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">JACKPOT</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[c.status]}`}>
                        {c.status === "active" ? "Not used" : c.status === "redeemed" ? "Used" : "Expired"}
                      </span>
                      {isNew && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">NEW</span>}
                    </div>
                    <p className="mt-1 text-sm">
                      <b>{c.spin_customers?.full_name}</b> · <span className="tabular-nums">{c.spin_customers?.phone}</span>
                    </p>
                    <p className="mt-1 font-mono text-base font-bold tracking-wider">{c.code}</p>
                    <p className="mt-1 text-xs text-muted">
                      Won {fmtDateTime(c.won_at)} · valid until {fmtDate(c.expires_on)} · from {c.spin_players?.source ?? "website"}
                      {c.whatsapp_sent ? " · sent on WhatsApp" : ""}
                      {c.reservation_id ? " · added to a reservation" : ""}
                    </p>
                    {c.redeemed_at && (
                      <p className="mt-1 text-xs text-blue-800">
                        Used {fmtDateTime(c.redeemed_at)}
                        {c.redeemed_by ? ` · by ${c.redeemed_by}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {c.status === "active" && (
                      <button
                        type="button"
                        disabled={busy === c.id}
                        onClick={() => act(c, "redeem")}
                        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        Mark used
                      </button>
                    )}
                    {c.status === "redeemed" && canUndo && (
                      <button type="button" disabled={busy === c.id} onClick={() => act(c, "undo")} className="text-xs font-semibold text-muted hover:text-primary">
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
