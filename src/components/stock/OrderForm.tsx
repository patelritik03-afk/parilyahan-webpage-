"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatQty, type StockItem } from "@/lib/stock/types";
import { itemUnits, todayDubai } from "@/lib/stock/ops";
import { ItemPicker, Message, SupplierSelect, btnOutline, btnPrimary, card, field, label, postJson, useStockData } from "./ui";

type Line = { key: string; item: StockItem; unit: string; qty: string; note: string };
let counter = 0;

type Existing = {
  id: string;
  supplier_id: string | null;
  needed_by: string | null;
  notes: string | null;
  purchase_order_lines: { item_id: string; qty: number; unit: string; note: string | null }[];
};

export default function OrderForm({ existing, fromPar = false }: { existing?: Existing; fromPar?: boolean }) {
  const router = useRouter();
  const { items, suppliers } = useStockData();
  const [supplierId, setSupplierId] = useState(existing?.supplier_id ?? "");
  const [neededBy, setNeededBy] = useState(existing?.needed_by ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [lines, setLines] = useState<Line[]>([]);
  const [prefilled, setPrefilled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Fill the lines once the items are loaded: from an existing draft, or from "what to buy".
  useEffect(() => {
    if (!items || prefilled) return;
    Promise.resolve().then(() => {
      if (existing) {
        setLines(
          existing.purchase_order_lines.flatMap((l) => {
            const item = items.find((i) => i.id === l.item_id);
            return item ? [{ key: `o${counter++}`, item, unit: l.unit, qty: String(l.qty), note: l.note ?? "" }] : [];
          })
        );
      } else if (fromPar) {
        setLines(
          items
            .filter((i) => i.active && i.par_level !== null && i.qty < i.par_level)
            .map((i) => ({
              key: `o${counter++}`,
              item: i,
              unit: i.base_unit,
              qty: String(Math.ceil(((i.par_level ?? 0) - i.qty) * 10) / 10),
              note: "",
            }))
        );
      }
      setPrefilled(true);
    });
  }, [items, existing, fromPar, prefilled]);

  const add = (item: StockItem) => {
    const units = itemUnits(item);
    setLines((p) => [...p, { key: `o${counter++}`, item, unit: units.length > 1 ? units[1].unit : units[0].unit, qty: "", note: "" }]);
    if (!supplierId && item.default_supplier_id) setSupplierId(item.default_supplier_id);
  };
  const update = (key: string, patch: Partial<Line>) => setLines((p) => p.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  async function save(submit: boolean, e?: FormEvent) {
    e?.preventDefault();
    setError("");
    if (lines.length === 0) return setError("Add at least one item.");
    if (lines.some((l) => !(Number(l.qty) > 0))) return setError("Enter a quantity above 0 for every item.");
    setBusy(true);
    const payload = {
      supplier_id: supplierId || null,
      needed_by: neededBy || null,
      notes,
      lines: lines.map((l) => ({ item_id: l.item.id, qty: Number(l.qty), unit: l.unit, note: l.note })),
    };
    const result = existing
      ? await postJson(`/api/admin/stock/orders/${existing.id}`, { action: submit ? "submit" : "update", ...payload }, "PATCH")
      : await postJson("/api/admin/stock/orders", { ...payload, submit });
    setBusy(false);
    if (!result.ok) return setError(result.data.error ?? "Could not save the order.");
    router.push(`/stock/orders/${existing?.id ?? result.data.id}`);
    router.refresh();
  }

  if (!items) return <p className="text-sm text-muted">Loading...</p>;

  return (
    <form onSubmit={(e) => save(true, e)} className="space-y-6">
      {fromPar && !existing && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {lines.length > 0
            ? "Filled with every item below its par level, ordering up to par. Remove what you don't need."
            : "No items are below their par level right now."}
        </p>
      )}
      <div className={`${card} grid gap-4 p-4 sm:grid-cols-3`}>
        <label className={label}>
          Supplier
          <SupplierSelect suppliers={suppliers} value={supplierId} onChange={setSupplierId} />
        </label>
        <label className={label}>
          Needed by (optional)
          <input type="date" min={todayDubai()} value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className={field} />
        </label>
        <label className={label}>
          Notes (optional)
          <input value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} className={field} />
        </label>
      </div>

      <div className="space-y-3">
        <ItemPicker items={items} onPick={add} exclude={lines.map((l) => l.item.id)} placeholder="Search an item to order..." />
        {lines.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">Search above and tap an item to add it.</p>
        ) : (
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.key} className={`${card} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{l.item.name}</p>
                    <p className="text-xs text-muted">
                      In stock {formatQty(l.item.qty)} {l.item.base_unit}
                      {l.item.par_level !== null ? ` - par ${formatQty(l.item.par_level)}` : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => setLines((p) => p.filter((x) => x.key !== l.key))} className="text-sm font-semibold text-red-600">
                    Remove
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <label className={label}>
                    Quantity
                    <input type="number" inputMode="decimal" min={0} step="any" value={l.qty} onChange={(e) => update(l.key, { qty: e.target.value })} className={field} />
                  </label>
                  <label className={label}>
                    Unit
                    <select value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} className={field}>
                      {itemUnits(l.item).map((u) => (
                        <option key={u.unit} value={u.unit}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={`${label} col-span-2 sm:col-span-1`}>
                    Note (brand, size...)
                    <input value={l.note} maxLength={200} onChange={(e) => update(l.key, { note: e.target.value })} className={field} />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <Message ok={false}>{error}</Message>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => save(false)} className={btnOutline}>
          Save as draft
        </button>
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Saving..." : "Send for approval"}
        </button>
      </div>
    </form>
  );
}
