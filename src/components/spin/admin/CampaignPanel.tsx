"use client";

import { useState } from "react";
import Wheel from "../Wheel";
import type { AdminCampaign, AdminPrize } from "./shared";

const field = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";
const small = "mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none";
const label = "text-xs font-semibold uppercase tracking-wide text-foreground/70";
const btn = "rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";

async function send(url: string, body: unknown) {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return res.ok ? null : (json.error as string) ?? "Could not save.";
}

export default function CampaignPanel({
  campaign,
  owner,
  otpTemplateReady,
  onSaved,
}: {
  campaign: AdminCampaign;
  owner: boolean;
  otpTemplateReady: boolean;
  onSaved: () => void;
}) {
  const { spin_prizes, ...initial } = campaign;
  const [c, setC] = useState(initial);
  const [prizes, setPrizes] = useState<AdminPrize[]>(spin_prizes);
  const [msg, setMsg] = useState<{ part: "campaign" | "prizes"; ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewLang, setPreviewLang] = useState<"en" | "tl">("en");

  const total = Math.round(prizes.reduce((s, p) => s + (Number(p.chance) || 0), 0) * 1000) / 1000;
  const setPrize = (id: string, patch: Partial<AdminPrize>) =>
    setPrizes((list) =>
      list.map((p) => (p.id === id ? { ...p, ...patch } : patch.is_fallback ? { ...p, is_fallback: false } : p))
    );

  async function saveCampaign() {
    setBusy(true);
    setMsg(null);
    const error = await send("/api/admin/spin", c);
    setBusy(false);
    setMsg({ part: "campaign", ok: !error, text: error ?? (c.active ? "Saved. The contest is ON 🎉" : "Saved.") });
    if (!error) onSaved();
  }

  async function savePrizes() {
    setBusy(true);
    setMsg(null);
    const error = await send("/api/admin/spin/prizes", {
      campaign_id: c.id,
      prizes: prizes.map((p) => ({
        id: p.id,
        emoji: p.emoji,
        label_en: p.label_en,
        label_tl: p.label_tl,
        short_en: p.short_en,
        short_tl: p.short_tl,
        color: p.color,
        chance: Number(p.chance),
        limit_count: p.limit_count === null || String(p.limit_count) === "" ? null : Number(p.limit_count),
        limit_period: p.limit_count === null || String(p.limit_count) === "" ? null : p.limit_period ?? "day",
        release_day: Number(p.release_day) || 1,
        is_fallback: p.is_fallback,
        is_jackpot: p.is_jackpot,
        terms: p.terms?.trim() ? p.terms : null,
      })),
    });
    setBusy(false);
    setMsg({ part: "prizes", ok: !error, text: error ?? "Wheel saved." });
    if (!error) onSaved();
  }

  return (
    <div className="space-y-8">
      {/* Campaign settings */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold">Campaign</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={label}>Name (for you)</span>
            <input className={field} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
          </label>
          <label className="block">
            <span className={label}>Starts</span>
            <input type="date" className={field} value={c.starts_on} onChange={(e) => setC({ ...c, starts_on: e.target.value })} />
          </label>
          <label className="block">
            <span className={label}>Ends</span>
            <input type="date" className={field} value={c.ends_on} onChange={(e) => setC({ ...c, ends_on: e.target.value })} />
          </label>
          <label className="block">
            <span className={label}>Coupons valid for (days)</span>
            <input
              type="number"
              min={1}
              className={field}
              value={c.coupon_days}
              onChange={(e) => setC({ ...c, coupon_days: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className={label}>How players verify their number</span>
            <select
              className={field}
              value={c.verify_mode}
              disabled={!owner}
              onChange={(e) => setC({ ...c, verify_mode: e.target.value as AdminCampaign["verify_mode"] })}
            >
              <option value="reverse">Free: player sends us a WhatsApp message</option>
              <option value="typed" disabled={!otpTemplateReady}>
                Paid: we send a code, player types it{otpTemplateReady ? "" : " (template not set up)"}
              </option>
              <option value="both" disabled={!otpTemplateReady}>
                Both (player chooses){otpTemplateReady ? "" : " (template not set up)"}
              </option>
            </select>
            {!owner && <span className="mt-1 block text-xs text-muted">Only the owner can change this.</span>}
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Contest terms (shown to players)</span>
            <textarea rows={5} className={field} value={c.terms ?? ""} onChange={(e) => setC({ ...c, terms: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={c.banner} onChange={(e) => setC({ ...c, banner: e.target.checked })} />
            Show the Spin &amp; Win banner on the website
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={c.active} onChange={(e) => setC({ ...c, active: e.target.checked })} />
            Contest is ON (runs between the dates above)
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className={btn} disabled={busy} onClick={saveCampaign}>
            Save campaign
          </button>
          {msg?.part === "campaign" && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
        </div>
      </section>

      {/* Wheel editor */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Wheel &amp; prizes</h2>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${total === 100 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
            Chances total {total}% {total === 100 ? "✅" : "(must be 100%)"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Limits: when a prize has reached its limit (or isn&apos;t released yet), the player gets the &quot;instead&quot; prize. Release day 8 = from
          the second week.
        </p>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {prizes.map((p) => (
              <div key={p.id} className="rounded-xl border border-border p-4" style={{ borderLeft: `6px solid ${p.color}` }}>
                <div className="grid grid-cols-[60px_1fr_1fr] gap-3">
                  <label>
                    <span className={label}>Emoji</span>
                    <input className={`${small} text-center text-xl`} value={p.emoji} onChange={(e) => setPrize(p.id, { emoji: e.target.value })} />
                  </label>
                  <label>
                    <span className={label}>On wheel (EN)</span>
                    <input className={small} maxLength={18} value={p.short_en} onChange={(e) => setPrize(p.id, { short_en: e.target.value })} />
                  </label>
                  <label>
                    <span className={label}>On wheel (TL)</span>
                    <input className={small} maxLength={18} value={p.short_tl} onChange={(e) => setPrize(p.id, { short_tl: e.target.value })} />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className={label}>Prize text (EN)</span>
                    <input className={small} value={p.label_en} onChange={(e) => setPrize(p.id, { label_en: e.target.value })} />
                  </label>
                  <label>
                    <span className={label}>Prize text (TL)</span>
                    <input className={small} value={p.label_tl} onChange={(e) => setPrize(p.id, { label_tl: e.target.value })} />
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <label>
                    <span className={label}>Chance %</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      className={small}
                      value={p.chance}
                      onChange={(e) => setPrize(p.id, { chance: e.target.value as unknown as number })}
                    />
                  </label>
                  <label>
                    <span className={label}>Max winners</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="no limit"
                      disabled={p.is_fallback}
                      className={small}
                      value={p.limit_count ?? ""}
                      onChange={(e) => setPrize(p.id, { limit_count: e.target.value === "" ? null : Number(e.target.value), limit_period: p.limit_period ?? "day" })}
                    />
                  </label>
                  <label>
                    <span className={label}>Per</span>
                    <select
                      className={small}
                      disabled={p.limit_count === null || p.is_fallback}
                      value={p.limit_period ?? "day"}
                      onChange={(e) => setPrize(p.id, { limit_period: e.target.value as AdminPrize["limit_period"] })}
                    >
                      <option value="day">day</option>
                      <option value="week">week</option>
                      <option value="campaign">whole contest</option>
                    </select>
                  </label>
                  <label>
                    <span className={label}>From day</span>
                    <input
                      type="number"
                      min={1}
                      disabled={p.is_fallback}
                      className={small}
                      value={p.release_day}
                      onChange={(e) => setPrize(p.id, { release_day: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    <span className={label}>Colour</span>
                    <input type="color" className="mt-1 h-9 w-full cursor-pointer rounded-md border border-border" value={p.color} onChange={(e) => setPrize(p.id, { color: e.target.value })} />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="fallback"
                      checked={p.is_fallback}
                      onChange={() => setPrize(p.id, { is_fallback: true, limit_count: null, limit_period: null, release_day: 1 })}
                    />
                    &quot;Instead&quot; prize
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={p.is_jackpot} onChange={(e) => setPrize(p.id, { is_jackpot: e.target.checked })} />
                    Jackpot (gold, owner is notified)
                  </label>
                </div>
                <label className="mt-3 block">
                  <span className={label}>Prize details / terms (optional)</span>
                  <input
                    className={small}
                    placeholder="e.g. 1 night, 2 adults, Sun–Thu, subject to availability"
                    value={p.terms ?? ""}
                    onChange={(e) => setPrize(p.id, { terms: e.target.value })}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl bg-[#14213d] p-4">
              <Wheel prizes={prizes} lang={previewLang} />
            </div>
            <div className="mt-2 flex justify-center gap-2 text-sm">
              {(["en", "tl"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setPreviewLang(l)}
                  className={`rounded-full px-3 py-1 font-semibold ${previewLang === l ? "bg-foreground text-background" : "border border-border"}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className={btn} disabled={busy || total !== 100} onClick={savePrizes}>
            Save wheel
          </button>
          {msg?.part === "prizes" && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
        </div>
      </section>
    </div>
  );
}
