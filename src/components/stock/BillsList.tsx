"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatAed } from "@/lib/stock/types";
import { shortDate } from "@/lib/stock/ops";
import { SupplierSelect, card, field, label, useStockData } from "./ui";

type BillRow = {
  id: string;
  bill_no: string | null;
  bill_date: string;
  total: number;
  created_by: string;
  photo_path: string | null;
  order_id: string | null;
  suppliers: { name: string } | null;
  purchase_bill_lines: { count: number }[];
};

export default function BillsList() {
  const { suppliers } = useStockData();
  const [bills, setBills] = useState<BillRow[] | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [supplier, setSupplier] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (supplier) params.set("supplier", supplier);
    const res = await fetch(`/api/admin/stock/bills?${params}`);
    const data = await res.json().catch(() => ({}));
    setBills(data.bills ?? []);
  }, [from, to, supplier]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const total = (bills ?? []).reduce((s, b) => s + Number(b.total), 0);

  return (
    <div className="space-y-4">
      <div className={`${card} grid gap-3 p-4 sm:grid-cols-3`}>
        <label className={label}>
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
        </label>
        <label className={label}>
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={field} />
        </label>
        <label className={label}>
          Supplier
          <SupplierSelect suppliers={suppliers} value={supplier} onChange={setSupplier} />
        </label>
      </div>
      {bills === null ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : bills.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">No bills yet.</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {bills.length} bills - {formatAed(total)}
          </p>
          <ul className={`${card} divide-y divide-border`}>
            {bills.map((b) => (
              <li key={b.id}>
                <Link href={`/stock/bills/${b.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{b.suppliers?.name ?? "No supplier"}</span>
                    <span className="block text-xs text-muted">
                      {shortDate(b.bill_date)}
                      {b.bill_no ? ` - #${b.bill_no}` : ""} - {b.purchase_bill_lines?.[0]?.count ?? 0} items - by {b.created_by}
                      {b.photo_path ? " - photo" : ""}
                      {b.order_id ? " - from order" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatAed(Number(b.total))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
