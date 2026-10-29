"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAed, formatQty } from "@/lib/stock/types";
import { dateTime, shortDate } from "@/lib/stock/ops";
import { Message, btnDanger, card } from "./ui";

type Line = {
  id: string;
  qty: number;
  unit: string;
  base_qty: number;
  unit_price: number;
  line_total: number;
  base_cost: number;
  change_pct: number | null;
  stock_items: { name: string; base_unit: string };
};
type Bill = {
  id: string;
  bill_no: string | null;
  bill_date: string;
  total: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  suppliers: { name: string; phone: string | null } | null;
  purchase_bill_lines: Line[];
};

export default function BillDetail({ id, saved, alerts }: { id: string; saved: boolean; alerts: number }) {
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/stock/bills/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return setError(data.error);
        setBill(data.bill);
        setPhotoUrl(data.photoUrl);
        setCanDelete(data.canDelete);
      });
  }, [id]);

  async function remove() {
    if (!confirm("Delete this bill? Its stock is taken back out and the costs are recalculated.")) return;
    const res = await fetch(`/api/admin/stock/bills/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Could not delete the bill.");
    router.push("/stock/bills");
  }

  if (error) return <Message ok={false}>{error}</Message>;
  if (!bill) return <p className="text-sm text-muted">Loading...</p>;

  return (
    <div className="space-y-5">
      {saved && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">
          Bill saved and stock added.
          {alerts > 0 && <strong className="ml-1 text-red-700">{alerts} price rise(s) flagged - the owner has been notified.</strong>}
        </div>
      )}
      <div className={`${card} grid gap-3 p-4 text-sm sm:grid-cols-2`}>
        <p>
          <span className="text-muted">Supplier:</span> <strong>{bill.suppliers?.name ?? "No supplier"}</strong>
        </p>
        <p>
          <span className="text-muted">Bill date:</span> <strong>{shortDate(bill.bill_date)}</strong>
          {bill.bill_no && <span className="text-muted"> - #{bill.bill_no}</span>}
        </p>
        <p>
          <span className="text-muted">Entered by:</span> {bill.created_by} on {dateTime(bill.created_at)}
        </p>
        <p>
          <span className="text-muted">Total:</span> <strong>{formatAed(Number(bill.total))}</strong>
        </p>
        {bill.notes && <p className="sm:col-span-2">{bill.notes}</p>}
        {photoUrl && (
          <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
            View bill photo
          </a>
        )}
      </div>
      <ul className={`${card} divide-y divide-border`}>
        {bill.purchase_bill_lines.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="min-w-0">
              <span className="block font-medium">{l.stock_items.name}</span>
              <span className="block text-xs text-muted">
                {formatQty(l.qty)} {l.unit} x {formatAed(Number(l.unit_price))}
                {l.unit !== l.stock_items.base_unit && ` (= ${formatQty(l.base_qty)} ${l.stock_items.base_unit})`}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-semibold">{formatAed(Number(l.line_total))}</span>
              {l.change_pct !== null && Number(l.change_pct) !== 0 && (
                <span className={`block text-xs ${Number(l.change_pct) > 0 ? "text-red-600" : "text-green-700"}`}>
                  {Number(l.change_pct) > 0 ? "+" : ""}
                  {l.change_pct}% vs last price
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {canDelete && (
        <button type="button" onClick={remove} className={btnDanger}>
          Delete bill
        </button>
      )}
    </div>
  );
}
