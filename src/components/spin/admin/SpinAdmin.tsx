"use client";

import { useCallback, useEffect, useState } from "react";
import CouponsPanel from "./CouponsPanel";
import CampaignPanel from "./CampaignPanel";
import CustomersPanel from "./CustomersPanel";
import StatsPanel from "./StatsPanel";
import QrPanel from "./QrPanel";
import type { SpinOverview } from "./shared";

type Tab = "coupons" | "campaign" | "customers" | "stats" | "qr";

const TABS: { id: Tab; label: string; manager?: boolean }[] = [
  { id: "coupons", label: "🎟️ Coupons" },
  { id: "campaign", label: "🎡 Campaign & wheel", manager: true },
  { id: "customers", label: "👥 Customers", manager: true },
  { id: "stats", label: "📊 Stats", manager: true },
  { id: "qr", label: "🔳 QR codes & links", manager: true },
];

export default function SpinAdmin() {
  const [data, setData] = useState<SpinOverview | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("coupons");
  const [campaignId, setCampaignId] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/spin");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.error ?? "Could not load.");
    setData(json);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads once on open
    load();
  }, [load]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Loading…</p>;

  const tabs = TABS.filter((t) => !t.manager || data.manager);
  // The campaign that is switched on, otherwise the newest; heads can switch between them.
  const campaign =
    data.campaigns.find((c) => c.id === campaignId) ?? data.campaigns.find((c) => c.active) ?? data.campaigns[0];

  return (
    <div>
      {data.manager && !data.whatsappReady && (
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <b>WhatsApp is not connected yet.</b> Players can&apos;t verify their number until the WhatsApp Cloud API keys are added
          in Vercel. Everything else here works.
        </div>
      )}
      {data.manager && campaign && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-sm">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${campaign.active ? "bg-green-100 text-green-800" : "bg-border/60 text-foreground/70"}`}>
            {campaign.active ? "ON" : "OFF"}
          </span>
          {data.campaigns.length > 1 ? (
            <select
              aria-label="Campaign"
              className="rounded-md border border-border bg-background px-2 py-1 font-semibold"
              value={campaign.id}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              {data.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-semibold">{campaign.name}</span>
          )}
          <span className="text-muted">
            {campaign.starts_on} → {campaign.ends_on}
          </span>
          <a href="/spin" target="_blank" className="ml-auto font-semibold text-primary hover:underline">
            Open the game ↗
          </a>
        </div>
      )}
      {tabs.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                tab === t.id ? "bg-foreground text-background" : "border border-border bg-surface hover:border-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {tab === "coupons" && <CouponsPanel canUndo={data.manager} />}
      {tab === "campaign" && campaign && (
        <CampaignPanel key={campaign.id} campaign={campaign} owner={data.owner} otpTemplateReady={data.otpTemplateReady} onSaved={load} />
      )}
      {tab === "customers" && <CustomersPanel />}
      {tab === "stats" && campaign && <StatsPanel campaignId={campaign.id} />}
      {tab === "qr" && <QrPanel />}
    </div>
  );
}
