"use client";

import { useCallback, useEffect, useState } from "react";
import { formatAed, formatQty, type StockItem } from "@/lib/stock/types";
import { WASTAGE_REASONS, dateTime, todayDubai } from "@/lib/stock/ops";
import { addDaysISO } from "@/lib/date";
import { ItemPicker, Message, btnPrimary, card, field, label, postJson, useStockData } from "./ui";

type Kind = "consumption" | "wastage";
type Pending = { key: string; item: StockItem; type: Kind; qty: string; reason: string; note: string };
type Entry = {
  id: string;
  type: Kind;
  qty: number;
  unit_cost?: number;
  reason: string | null;
  note: string | null;
  created_by: string;
  created_at: string;
  canDelete: boolean;
  stock_items: { name: string; base_unit: string };
};

let counter = 0;

export default function UsageManager({ manager }: { manager: boolean }) {
  const { items, reload: reloadItems } = useStockData();
  const today = todayDubai();
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<Kind>("consumption");
  const [pending, setPending] = useState<Pending[]>([]);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const loadEntries = useCallback(async () => {
    const res = await fetch(`/api/admin/stock/usage?date=${date}`);
    const data = await res.json().catch(() => ({}));
    setEntries(data.entries ?? []);
  }, [date]);

  useEffect(() => {
    Promise.resolve().then(loadEntries);
  }, [loadEntries]);

  const add = (item: StockItem) =>
    setPending((p) => [...p, { key: `u${counter++}`, item, type: kind, qty: "", reason: kind === "wastage" ? WASTAGE_REASONS[0] : "", note: "" }]);
  const update = (key: string, patch: Partial<Pending>) => setPending((p) => p.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  async function save() {
    setMessage(null);
    if (pending.some((p) => !(Number(p.qty) > 0))) return setMessage({ ok: false, text: "Enter a quantity above 0 for every line." });
    setBusy(true);
    const { ok, data } = await postJson("/api/admin/stock/usage", {
      date,
      lines: pending.map((p) => ({ item_id: p.item.id, qty: Number(p.qty), type: p.type, reason: p.reason, note: p.note })),
    });
    setBusy(false);
    if (!ok) return setMessage({ ok: false, text: data.error ?? "Could not save." });
    setPending([]);
    setMessage({ ok: true, text: `${data.saved} entries saved.` });
    await Promise.all([loadEntries(), reloadItems()]);
  }

  async function remove(entry: Entry) {
    if (!confirm(`Remove ${entry.stock_items.name} (${formatQty(entry.qty)} ${entry.stock_items.base_unit})?`)) return;
    const res = await fetch(`/api/admin/stock/usage/${entry.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage({ ok: false, text: data.error ?? "Could not remove." });
    await Promise.all([loadEntries(), reloadItems()]);
  }

  const used = (entries ?? []).filter((e) => e.type === "consumption");
  const wasted = (entries ?? []).filter((e) => e.type === "wastage");
  const value = (list: Entry[]) => list.reduce((s, e) => s + e.qty * (e.unit_cost ?? 0), 0);
  const minDate = manager ? undefined : addDaysISO(today, -7);

  return (
    <div className="space-y-6">
      <div className={`${card} flex flex-wrap items-end gap-4 p-4`}>
        <label className={label}>
          Date
          <input type="date" value={date} max={today} min={minDate} onChange={(e) => e.target.value && setDate(e.target.value)} className={field} />
        </label>
        <div className="flex gap-2" role="group" aria-label="Entry type">
          {(["consumption", "wastage"] as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold ${kind === k ? (k === "wastage" ? "bg-red-600 text-white" : "bg-primary text-primary-foreground") : "border border-border bg-background"}`}
            >
              {k === "consumption" ? "Used in kitchen" : "Wastage"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <ItemPicker
          items={items ?? []}
          onPick={add}
          placeholder={kind === "wastage" ? "Search an item that was wasted..." : "Search an item that was used..."}
        />
        {pending.length > 0 && (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.key} className={`${card} p-4 ${p.type === "wastage" ? "border-red-300" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">
                    {p.item.name}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${p.type === "wastage" ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"}`}>
                      {p.type === "wastage" ? "Wastage" : "Used"}
                    </span>
                  </p>
                  <button type="button" onClick={() => setPending((x) => x.filter((y) => y.key !== p.key))} className="text-sm font-semibold text-red-600">
                    Remove
                  </button>
                </div>
                <p className="text-xs text-muted">
                  In stock: {formatQty(p.item.qty)} {p.item.base_unit}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className={label}>
                    Quantity ({p.item.base_unit})
                    <input type="number" inputMode="decimal" min={0} step="any" value={p.qty} autoFocus
                      onChange={(e) => update(p.key, { qty: e.target.value })} className={field} />
                  </label>
                  {p.type === "wastage" && (
                    <label className={label}>
                      Reason
                      <select value={p.reason} onChange={(e) => update(p.key, { reason: e.target.value })} className={field}>
                        {WASTAGE_REASONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className={label}>
                    Note (optional)
                    <input value={p.note} maxLength={200} onChange={(e) => update(p.key, { note: e.target.value })} className={field} />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pending.length > 0 && (
          <button type="button" onClick={save} disabled={busy} className={`${btnPrimary} w-full py-3 text-base`}>
            {busy ? "Saving..." : `Save ${pending.length} ${pending.length === 1 ? "entry" : "entries"}`}
          </button>
        )}
        {message && <Message ok={message.ok}>{message.text}</Message>}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Entries for this day</h2>
        {entries === null ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">Nothing entered for this day yet.</p>
        ) : (
          <>
            {manager && (
              <p className="text-sm">
                Used: <strong>{formatAed(value(used))}</strong> - Wastage: <strong className="text-red-600">{formatAed(value(wasted))}</strong>
              </p>
            )}
            <ul className={`${card} divide-y divide-border`}>
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium">
                      {e.stock_items.name}
                      {e.type === "wastage" && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Wastage{e.reason ? `: ${e.reason}` : ""}</span>}
                    </span>
                    <span className="block text-xs text-muted">
                      {e.created_by} - {dateTime(e.created_at)}
                      {e.note ? ` - ${e.note}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold">
                      {formatQty(e.qty)} {e.stock_items.base_unit}
                    </span>
                    {e.canDelete && (
                      <button type="button" onClick={() => remove(e)} className="text-xs font-semibold text-red-600">
                        Remove
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
