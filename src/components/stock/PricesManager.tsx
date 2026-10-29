"use client";

import { useCallback, useEffect, useState } from "react";
import { formatAed, formatQty, type StockItem } from "@/lib/stock/types";
import { dateTime, shortDate } from "@/lib/stock/ops";
import { ItemPicker, Message, btnOutline, card, field, label, postJson, useStockData } from "./ui";

type Alert = {
  id: string;
  old_cost: number;
  new_cost: number;
  change_pct: number;
  seen_by: string | null;
  created_at: string;
  stock_items: { name: string; base_unit: string } | null;
  suppliers: { name: string } | null;
  purchase_bills: { bill_date: string; bill_no: string | null } | null;
};
type HistoryRow = { date: string; bill_no: string | null; supplier: string | null; qty: number; unit: string; unit_price: number; base_cost: number; change_pct: number | null };

export default function PricesManager() {
  const { items } = useStockData();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [pct, setPct] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [item, setItem] = useState<StockItem | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/stock/prices");
    const data = await res.json().catch(() => ({}));
    setAlerts(data.alerts ?? []);
    setPct(String(data.pct ?? 5));
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  async function savePct() {
    const { ok, data } = await postJson("/api/admin/stock/prices", { pct: Number(pct) }, "PATCH");
    setMessage(ok ? { ok: true, text: "Saved." } : { ok: false, text: data.error ?? "Could not save." });
  }

  async function markSeen(ids?: string[]) {
    await postJson("/api/admin/stock/prices", ids ? { seenIds: ids } : { allSeen: true }, "PATCH");
    await load();
  }

  async function pick(next: StockItem) {
    setItem(next);
    setHistory(null);
    const res = await fetch(`/api/admin/stock/prices/history?item=${next.id}`);
    const data = await res.json().catch(() => ({}));
    setHistory(data.history ?? []);
  }

  const unseen = (alerts ?? []).filter((a) => !a.seen_by);
  const bySupplier = (rows: HistoryRow[]) => {
    const map = new Map<string, number[]>();
    for (const r of rows) map.set(r.supplier ?? "No supplier", [...(map.get(r.supplier ?? "No supplier") ?? []), r.base_cost]);
    return [...map].map(([name, costs]) => ({ name, last: costs[0], low: Math.min(...costs), high: Math.max(...costs), bills: costs.length }));
  };

  return (
    <div className="space-y-8">
      <section className={`${card} flex flex-wrap items-end gap-3 p-4`}>
        <label className={label}>
          Alert me when a price goes up by more than (%)
          <input type="number" min={0} max={500} step="any" value={pct} onChange={(e) => setPct(e.target.value)} className={`${field} w-32`} />
        </label>
        <button type="button" onClick={savePct} className={btnOutline}>
          Save
        </button>
        {message && <Message ok={message.ok}>{message.text}</Message>}
        <p className="w-full text-xs text-muted">
          Compared with the last price paid for the same item. The owner gets an email and WhatsApp straight away.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Price rises ({unseen.length} new)</h2>
          {unseen.length > 0 && (
            <button type="button" onClick={() => markSeen()} className={btnOutline}>
              Mark all as seen
            </button>
          )}
        </div>
        {alerts === null ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : alerts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">No price rises so far.</p>
        ) : (
          <ul className={`${card} divide-y divide-border`}>
            {alerts.map((a) => (
              <li key={a.id} className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${a.seen_by ? "opacity-60" : ""}`}>
                <span className="min-w-0">
                  <span className="block font-medium">{a.stock_items?.name}</span>
                  <span className="block text-xs text-muted">
                    {a.suppliers?.name ?? "No supplier"} - bill {a.purchase_bills ? shortDate(a.purchase_bills.bill_date) : ""} - {dateTime(a.created_at)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-right">
                  <span>
                    <span className="block font-semibold text-red-600">+{Number(a.change_pct)}%</span>
                    <span className="block text-xs text-muted">
                      {formatAed(Number(a.old_cost))} → {formatAed(Number(a.new_cost))}/{a.stock_items?.base_unit}
                    </span>
                  </span>
                  {!a.seen_by && (
                    <button type="button" onClick={() => markSeen([a.id])} className="text-xs font-semibold text-primary">
                      Seen
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Price history</h2>
        <ItemPicker items={items ?? []} onPick={pick} placeholder="Search an item to see what you paid..." />
        {item && (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{item.name}</strong> - average cost {formatAed(item.avg_cost ?? 0)}/{item.base_unit}
              {item.last_price ? `, last paid ${formatAed(item.last_price)}/${item.base_unit}` : ""}
            </p>
            {history === null ? (
              <p className="text-sm text-muted">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted">No bills for this item yet.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {bySupplier(history).map((s) => (
                    <div key={s.name} className={`${card} p-3 text-sm`}>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted">
                        Last {formatAed(s.last)} - lowest {formatAed(s.low)} - highest {formatAed(s.high)} per {item.base_unit} ({s.bills} bills)
                      </p>
                    </div>
                  ))}
                </div>
                <ul className={`${card} divide-y divide-border`}>
                  {history.map((h, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span>
                        {shortDate(h.date)} - {h.supplier ?? "No supplier"}
                        <span className="block text-xs text-muted">
                          {formatQty(h.qty)} {h.unit} x {formatAed(h.unit_price)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold">
                          {formatAed(h.base_cost)}/{item.base_unit}
                        </span>
                        {h.change_pct !== null && h.change_pct !== 0 && (
                          <span className={`block text-xs ${h.change_pct > 0 ? "text-red-600" : "text-green-700"}`}>
                            {h.change_pct > 0 ? "+" : ""}
                            {h.change_pct}%
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
