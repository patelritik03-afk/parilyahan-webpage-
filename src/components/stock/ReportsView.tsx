"use client";

import { useCallback, useEffect, useState } from "react";
import { formatAed, formatQty } from "@/lib/stock/types";
import { shortDate, todayDubai } from "@/lib/stock/ops";
import { addDaysISO } from "@/lib/date";
import { btnOutline, card, field, label } from "./ui";

type ItemRow = { item_id: string; name: string; unit: string; qty: number; value: number };
type Report = {
  from: string;
  to: string;
  totals: { purchases: number; consumption: number; wastage: number; foodCost: number; stockValue: number; bills: number };
  daily: { date: string; consumption: number; wastage: number; purchases: number }[];
  topBought: ItemRow[];
  mostConsumed: ItemRow[];
  mostWasted: ItemRow[];
  mostExpensive: { item_id: string; name: string; unit: string; avg_cost: number; last_price: number | null }[];
  slowMovers: { item_id: string; name: string; unit: string; qty: number; value: number; lastUsed: string | null; daysOfStock: number | null }[];
  wastageByReason: { reason: string; value: number; entries: number }[];
  suppliers: { name: string; total: number; bills: number }[];
  openOrders: number;
  unseenAlerts: number;
};

function monthStart(iso: string, back = 0) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - back, 1));
  return d.toISOString().slice(0, 10);
}

const PRESETS = (today: string) => [
  { label: "Last 7 days", from: addDaysISO(today, -6), to: today },
  { label: "Last 30 days", from: addDaysISO(today, -29), to: today },
  { label: "This month", from: monthStart(today), to: today },
  { label: "Last month", from: monthStart(today, 1), to: addDaysISO(monthStart(today), -1) },
];

function Stat({ title, value, tone }: { title: string; value: string; tone?: "red" }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <p className={`mt-1 font-display text-xl font-bold ${tone === "red" ? "text-red-600" : ""}`}>{value}</p>
    </div>
  );
}

function Table({ title, rows, empty }: { title: string; rows: { name: string; left: string; right: string }[]; empty: string }) {
  return (
    <section className={`${card} p-4`}>
      <h3 className="font-display font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ol className="mt-2 divide-y divide-border text-sm">
          {rows.map((r, i) => (
            <li key={`${r.name}-${i}`} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate">
                <span className="mr-2 text-muted">{i + 1}.</span>
                {r.name}
              </span>
              <span className="shrink-0 text-right">
                <span className="font-semibold">{r.right}</span>
                <span className="block text-xs text-muted">{r.left}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// Daily food cost (consumption + wastage) as simple bars.
function DailyChart({ daily }: { daily: Report["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.consumption + d.wastage));
  const w = 720;
  const h = 180;
  const bw = w / Math.max(daily.length, 1);
  return (
    <section className={`${card} p-4`}>
      <h3 className="font-display font-semibold">Food cost per day</h3>
      <p className="text-xs text-muted">
        <span className="mr-1 inline-block h-2 w-3 rounded-sm bg-primary" /> used{" "}
        <span className="ml-3 mr-1 inline-block h-2 w-3 rounded-sm bg-amber-400" /> wasted
      </p>
      <svg viewBox={`0 0 ${w} ${h + 22}`} className="mt-2 w-full" role="img" aria-label="Food cost per day">
        {daily.map((d, i) => {
          const used = (d.consumption / max) * h;
          const waste = (d.wastage / max) * h;
          const x = i * bw + bw * 0.15;
          const width = Math.max(bw * 0.7, 1);
          return (
            <g key={d.date}>
              <title>{`${shortDate(d.date)}: used ${formatAed(d.consumption)}, wasted ${formatAed(d.wastage)}`}</title>
              <rect x={x} y={h - used} width={width} height={used} className="fill-primary" rx={2} />
              <rect x={x} y={h - used - waste} width={width} height={waste} className="fill-amber-400" rx={2} />
              {(daily.length <= 10 || i % Math.ceil(daily.length / 8) === 0) && (
                <text x={x + width / 2} y={h + 16} textAnchor="middle" className="fill-current text-[10px] opacity-60">
                  {d.date.slice(8)}/{d.date.slice(5, 7)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </section>
  );
}

export default function ReportsView() {
  const today = todayDubai();
  const [from, setFrom] = useState(addDaysISO(today, -29));
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/stock/reports?from=${from}&to=${to}`);
    const data = await res.json().catch(() => ({}));
    setReport(data.report ?? null);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const r = report;
  return (
    <div className="space-y-6">
      <div className={`${card} space-y-3 p-4`}>
        <div className="flex flex-wrap gap-2">
          {PRESETS(today).map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setFrom(p.from);
                setTo(p.to);
              }}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${from === p.from && to === p.to ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className={label}>
            From
            <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className={field} />
          </label>
          <label className={label}>
            To
            <input type="date" value={to} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} className={field} />
          </label>
          <a href={`/api/admin/stock/reports/export?from=${from}&to=${to}`} className={btnOutline}>
            Download Excel
          </a>
        </div>
      </div>

      {loading && !r ? (
        <p className="text-sm text-muted">Working out the numbers...</p>
      ) : !r ? (
        <p className="text-sm text-red-600">Could not load the report.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat title="Food cost (used + wasted)" value={formatAed(r.totals.foodCost)} />
            <Stat title="Used in kitchen" value={formatAed(r.totals.consumption)} />
            <Stat title="Wastage" value={formatAed(r.totals.wastage)} tone={r.totals.wastage > 0 ? "red" : undefined} />
            <Stat title={`Purchases (${r.totals.bills} bills)`} value={formatAed(r.totals.purchases)} />
            <Stat title="Stock value now" value={formatAed(r.totals.stockValue)} />
            <Stat title="Open orders / new price alerts" value={`${r.openOrders} / ${r.unseenAlerts}`} />
          </div>

          <DailyChart daily={r.daily} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Table
              title="Top bought (by AED)"
              empty="No bills in this period."
              rows={r.topBought.map((i) => ({ name: i.name, right: formatAed(i.value), left: `${formatQty(i.qty)} ${i.unit}` }))}
            />
            <Table
              title="Most consumed (by AED)"
              empty="No usage entered in this period."
              rows={r.mostConsumed.map((i) => ({ name: i.name, right: formatAed(i.value), left: `${formatQty(i.qty)} ${i.unit}` }))}
            />
            <Table
              title="Most expensive items (average cost)"
              empty="No costs yet."
              rows={r.mostExpensive.map((i) => ({
                name: i.name,
                right: `${formatAed(i.avg_cost)}/${i.unit}`,
                left: i.last_price ? `last paid ${formatAed(i.last_price)}` : "",
              }))}
            />
            <Table
              title="Slow movers (in stock, little or no use in 30 days)"
              empty="Nothing is sitting still."
              rows={r.slowMovers.map((i) => ({
                name: i.name,
                right: `${formatQty(i.qty)} ${i.unit}`,
                left: `${i.value ? formatAed(i.value) + " - " : ""}${i.lastUsed ? `last used ${shortDate(i.lastUsed)}` : "never used"}${i.daysOfStock ? ` - ${i.daysOfStock} days of stock` : ""}`,
              }))}
            />
            <Table
              title="Most wasted"
              empty="No wastage in this period."
              rows={r.mostWasted.map((i) => ({ name: i.name, right: formatAed(i.value), left: `${formatQty(i.qty)} ${i.unit}` }))}
            />
            <Table
              title="Wastage by reason"
              empty="No wastage in this period."
              rows={r.wastageByReason.map((w) => ({ name: w.reason, right: formatAed(w.value), left: `${w.entries} entries` }))}
            />
            <Table
              title="Spend by supplier"
              empty="No bills in this period."
              rows={r.suppliers.map((s) => ({ name: s.name, right: formatAed(s.total), left: `${s.bills} bills` }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
