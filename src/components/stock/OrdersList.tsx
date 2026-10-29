"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ORDER_STATUS_LABEL, dateTime, formatOrderNumber } from "@/lib/stock/ops";
import { StatusBadge, SupplierSelect, card, label, useStockData } from "./ui";

type OrderRow = {
  id: string;
  number: number;
  status: string;
  created_by: string;
  created_at: string;
  approved_by: string | null;
  needed_by: string | null;
  suppliers: { name: string } | null;
  purchase_order_lines: { count: number }[];
};

const FILTERS = ["", "submitted", "draft", "approved", "received", "rejected", "cancelled"];

export default function OrdersList() {
  const { suppliers } = useStockData();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [status, setStatus] = useState("");
  const [supplier, setSupplier] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (supplier) params.set("supplier", supplier);
    const res = await fetch(`/api/admin/stock/orders?${params}`);
    const data = await res.json().catch(() => ({}));
    setOrders(data.orders ?? []);
  }, [status, supplier]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${status === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}
          >
            {s ? ORDER_STATUS_LABEL[s] : "All"}
          </button>
        ))}
      </div>
      <label className={`${label} block max-w-sm`}>
        Supplier
        <SupplierSelect suppliers={suppliers} value={supplier} onChange={setSupplier} />
      </label>
      {orders === null ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">No orders yet.</p>
      ) : (
        <ul className={`${card} divide-y divide-border`}>
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/stock/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background">
                <span className="min-w-0">
                  <span className="block font-medium">
                    {formatOrderNumber(o.number)} - {o.suppliers?.name ?? "No supplier"}
                  </span>
                  <span className="block text-xs text-muted">
                    {o.purchase_order_lines?.[0]?.count ?? 0} items - by {o.created_by} {dateTime(o.created_at)}
                    {o.approved_by ? ` - ${o.status === "rejected" ? "rejected" : "approved"} by ${o.approved_by}` : ""}
                  </span>
                </span>
                <StatusBadge status={o.status} label={ORDER_STATUS_LABEL[o.status] ?? o.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
