"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatAed, type StockItem } from "@/lib/stock/types";
import { itemUnits, todayDubai } from "@/lib/stock/ops";
import { ItemPicker, Message, SupplierSelect, btnOutline, btnPrimary, card, field, label, postJson, useStockData } from "./ui";

type Line = { key: string; item: StockItem; unit: string; qty: string; price: string };

let counter = 0;

export default function BillForm({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const { items, suppliers } = useStockData();
  const [supplierId, setSupplierId] = useState("");
  const [billNo, setBillNo] = useState("");
  const [date, setDate] = useState(todayDubai());
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderLabel, setOrderLabel] = useState("");

  // Receiving an approved order: start the bill from the order's supplier and items.
  useEffect(() => {
    if (!orderId || !items) return;
    let cancelled = false;
    fetch(`/api/admin/stock/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.order) return;
        setSupplierId(data.order.supplier_id ?? "");
        setOrderLabel(`PO-${String(data.order.number).padStart(4, "0")}`);
        setLines(
          (data.order.purchase_order_lines ?? [])
            .map((l: { item_id: string; unit: string; qty: number; est_price: number | null }) => {
              const item = items.find((i) => i.id === l.item_id);
              if (!item) return null;
              return { key: `l${counter++}`, item, unit: l.unit, qty: String(l.qty), price: l.est_price == null ? "" : String(l.est_price) };
            })
            .filter(Boolean)
        );
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, items]);

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.price) || 0), 0),
    [lines]
  );

  function addItem(item: StockItem) {
    const units = itemUnits(item);
    const unit = units.length > 1 ? units[1].unit : units[0].unit;
    setLines((prev) => [...prev, { key: `l${counter++}`, item, unit, qty: "", price: "" }]);
  }

  const update = (key: string, patch: Partial<Line>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (lines.length === 0) return setError("Add at least one item.");
    if (lines.some((l) => !(Number(l.qty) > 0) || l.price === "" || Number(l.price) < 0)) {
      return setError("Enter a quantity and a price for every line (price can be 0 for free items).");
    }
    setBusy(true);
    let photoPath: string | null = null;
    if (photo) {
      const form = new FormData();
      form.append("file", photo);
      const res = await fetch("/api/admin/stock/bills/photo", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBusy(false);
        return setError(data.error ?? "Could not upload the photo.");
      }
      photoPath = data.path;
    }
    const { ok, data } = await postJson("/api/admin/stock/bills", {
      supplier_id: supplierId || null,
      bill_no: billNo,
      bill_date: date,
      notes,
      photo_path: photoPath,
      order_id: orderId ?? null,
      lines: lines.map((l) => ({ item_id: l.item.id, qty: Number(l.qty), unit: l.unit, unit_price: Number(l.price) })),
    });
    setBusy(false);
    if (!ok) return setError(data.error ?? "Could not save the bill.");
    router.push(`/stock/bills/${data.bill_id}?saved=1&alerts=${data.alerts ?? 0}`);
  }

  if (!items) return <p className="text-sm text-muted">Loading...</p>;

  return (
    <form onSubmit={submit} className="space-y-6">
      {orderLabel && (
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Receiving order <strong>{orderLabel}</strong>. Check the quantities and prices against the supplier&apos;s bill.
        </p>
      )}
      <div className={`${card} grid gap-4 p-4 sm:grid-cols-2`}>
        <label className={label}>
          Supplier
          <SupplierSelect suppliers={suppliers} value={supplierId} onChange={setSupplierId} />
        </label>
        <label className={label}>
          Bill / invoice number
          <input value={billNo} onChange={(e) => setBillNo(e.target.value)} maxLength={60} className={field} />
        </label>
        <label className={label}>
          Bill date
          <input type="date" required value={date} max={todayDubai()} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        <label className={label}>
          Photo of the bill (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:font-semibold file:text-primary"
          />
        </label>
      </div>

      <div className="space-y-3">
        <p className="font-display text-lg font-semibold">Items on the bill</p>
        <ItemPicker items={items} onPick={addItem} exclude={lines.map((l) => l.item.id)} />
        {lines.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">
            Search above and tap an item to add it.
          </p>
        ) : (
          <ul className="space-y-3">
            {lines.map((l) => {
              const units = itemUnits(l.item);
              const lineTotal = (Number(l.qty) || 0) * (Number(l.price) || 0);
              return (
                <li key={l.key} className={`${card} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{l.item.name}</p>
                      <p className="text-xs text-muted">{[l.item.brand, l.item.pack_size].filter(Boolean).join(" - ")}</p>
                    </div>
                    <button type="button" onClick={() => setLines((p) => p.filter((x) => x.key !== l.key))} className="text-sm font-semibold text-red-600">
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <label className={label}>
                      Qty
                      <input type="number" inputMode="decimal" min={0} step="any" required value={l.qty}
                        onChange={(e) => update(l.key, { qty: e.target.value })} className={field} />
                    </label>
                    <label className={label}>
                      Unit
                      <select value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} className={field}>
                        {units.map((u) => (
                          <option key={u.unit} value={u.unit}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={`${label} col-span-2 sm:col-span-1`}>
                      Price / {l.unit} (AED)
                      <input type="number" inputMode="decimal" min={0} step="any" required value={l.price}
                        onChange={(e) => update(l.key, { price: e.target.value })} className={field} />
                    </label>
                  </div>
                  <p className="mt-2 text-right text-sm text-muted">Line total {formatAed(lineTotal)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <label className={`${label} block`}>
        Notes (optional)
        <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className={field} />
      </label>

      <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-4`}>
        <p className="font-display text-xl font-bold">Total {formatAed(total)}</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className={btnOutline}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving..." : "Save bill"}
          </button>
        </div>
      </div>
      {error && <Message ok={false}>{error}</Message>}
    </form>
  );
}
