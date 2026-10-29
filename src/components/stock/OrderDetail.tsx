"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatQty } from "@/lib/stock/types";
import { ORDER_STATUS_LABEL, dateTime, formatOrderNumber, shortDate } from "@/lib/stock/ops";
import { downloadOrderPdf } from "@/lib/stock/pdf";
import OrderForm from "./OrderForm";
import { Message, StatusBadge, btnDanger, btnOutline, btnPrimary, card, field, postJson } from "./ui";

type Order = {
  id: string;
  number: number;
  status: string;
  supplier_id: string | null;
  needed_by: string | null;
  notes: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  reject_reason: string | null;
  bill_id: string | null;
  suppliers: { name: string; contact_name: string | null; phone: string | null; email: string | null } | null;
  purchase_order_lines: {
    id: string;
    item_id: string;
    qty: number;
    unit: string;
    note: string | null;
    stock_items: { name: string; base_unit: string; brand: string | null; pack_size: string | null };
  }[];
};
type Can = { edit: boolean; submit: boolean; approve: boolean; cancel: boolean; receive: boolean };

export default function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [can, setCan] = useState<Can | null>(null);
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/stock/orders/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage({ ok: false, text: data.error ?? "Could not load the order." });
    setOrder(data.order);
    setCan(data.can);
  }, [id]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage(null);
    const { ok, data } = await postJson(`/api/admin/stock/orders/${id}`, { action, ...extra }, "PATCH");
    setBusy(false);
    if (!ok) return setMessage({ ok: false, text: data.error ?? "Could not update the order." });
    await load();
  }

  async function pdf() {
    if (!order) return;
    await downloadOrderPdf(
      {
        number: order.number,
        status: order.status,
        created_at: order.created_at,
        created_by_name: order.created_by_name,
        approved_by_name: order.status === "rejected" ? null : order.approved_by_name,
        approved_at: order.status === "rejected" ? null : order.approved_at,
        needed_by: order.needed_by,
        notes: order.notes,
        supplier: order.suppliers,
        lines: order.purchase_order_lines.map((l) => ({
          name: l.stock_items.name,
          detail: [l.stock_items.brand, l.stock_items.pack_size].filter(Boolean).join(" - "),
          qty: Number(l.qty),
          unit: l.unit,
          note: l.note,
        })),
      },
      ORDER_STATUS_LABEL[order.status] ?? order.status
    );
  }

  if (!order || !can) return message ? <Message ok={false}>{message.text}</Message> : <p className="text-sm text-muted">Loading...</p>;
  if (editing) return <OrderForm existing={order} />;

  return (
    <div className="space-y-5">
      <div className={`${card} space-y-2 p-4 text-sm`}>
        <p className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">
          {formatOrderNumber(order.number)} <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status] ?? order.status} />
        </p>
        <p>
          <span className="text-muted">Supplier:</span> <strong>{order.suppliers?.name ?? "No supplier"}</strong>
          {order.suppliers?.phone && (
            <a href={`tel:${order.suppliers.phone.replace(/\s/g, "")}`} className="ml-2 text-primary underline">
              {order.suppliers.phone}
            </a>
          )}
        </p>
        <p>
          <span className="text-muted">Created by:</span> {order.created_by_name} - {dateTime(order.created_at)}
        </p>
        {order.approved_by_name && order.approved_at && (
          <p>
            <span className="text-muted">{order.status === "rejected" ? "Rejected by:" : "Approved by:"}</span> {order.approved_by_name} -{" "}
            {dateTime(order.approved_at)}
          </p>
        )}
        {order.reject_reason && <p className="text-red-700">Reason: {order.reject_reason}</p>}
        {order.needed_by && (
          <p>
            <span className="text-muted">Needed by:</span> {shortDate(order.needed_by)}
          </p>
        )}
        {order.notes && <p>{order.notes}</p>}
        {order.bill_id && (
          <Link href={`/stock/bills/${order.bill_id}`} className="font-semibold text-primary underline">
            View the bill for this order
          </Link>
        )}
      </div>

      <ul className={`${card} divide-y divide-border`}>
        {order.purchase_order_lines.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="min-w-0">
              <span className="block font-medium">{l.stock_items.name}</span>
              <span className="block text-xs text-muted">
                {[l.stock_items.brand, l.stock_items.pack_size, l.note].filter(Boolean).join(" - ")}
              </span>
            </span>
            <span className="shrink-0 font-semibold">
              {formatQty(Number(l.qty))} {l.unit}
            </span>
          </li>
        ))}
      </ul>

      {message && <Message ok={message.ok}>{message.text}</Message>}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={pdf} className={btnOutline}>
          Download PDF
        </button>
        {can.edit && (
          <button type="button" onClick={() => setEditing(true)} className={btnOutline}>
            Edit
          </button>
        )}
        {can.submit && (
          <button type="button" disabled={busy} onClick={() => act("submit")} className={btnPrimary}>
            Send for approval
          </button>
        )}
        {can.approve && (
          <button type="button" disabled={busy} onClick={() => act("approve")} className={btnPrimary}>
            Approve
          </button>
        )}
        {can.receive && (
          <Link href={`/stock/bills/new?order=${order.id}`} className={btnPrimary}>
            Received - enter the bill
          </Link>
        )}
        {can.cancel && (
          <button type="button" disabled={busy} onClick={() => confirm("Cancel this order?") && act("cancel")} className={btnDanger}>
            Cancel order
          </button>
        )}
      </div>
      {can.approve && (
        <div className={`${card} flex flex-wrap items-end gap-3 p-4`}>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Reason for rejecting (optional)" className={`${field} mt-0 max-w-md flex-1`} />
          <button type="button" disabled={busy} onClick={() => act("reject", { reason })} className={btnDanger}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
