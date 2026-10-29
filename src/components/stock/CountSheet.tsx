"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAed, formatQty, itemMatches } from "@/lib/stock/types";
import { COUNT_STATUS_LABEL, dateTime, shortDate } from "@/lib/stock/ops";
import { downloadCountSheet } from "@/lib/stock/pdf";
import { Message, StatusBadge, btnDanger, btnOutline, btnPrimary, card, field } from "./ui";

type Line = {
  item_id: string;
  name: string;
  base_unit: string;
  category: string;
  sub_category: string | null;
  system_qty: number;
  counted_qty: number | null;
  avg_cost?: number;
};
type Count = {
  id: string;
  count_date: string;
  scope: string;
  status: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  submitted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
};

export default function CountSheet({ id }: { id: string }) {
  const router = useRouter();
  const [count, setCount] = useState<Count | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [manager, setManager] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/stock/counts/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage({ ok: false, text: data.error ?? "Could not load the count." });
    setCount(data.count);
    setLines(data.lines);
    setManager(data.manager);
    setCanApprove(data.canApprove);
    setValues(Object.fromEntries(data.lines.map((l: Line) => [l.item_id, l.counted_qty === null ? "" : String(l.counted_qty)])));
  }, [id]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const editable = count?.status === "draft";
  const counted = lines.filter((l) => values[l.item_id] !== "" && values[l.item_id] !== undefined).length;
  const visible = useMemo(
    () =>
      lines
        .filter((l) => itemMatches({ name: l.name, brand: null, sub_category: l.sub_category, aliases: null }, query))
        .filter((l) => !onlyMissing || !values[l.item_id])
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [lines, query, onlyMissing, values]
  );

  async function send(action: "save" | "submit" | "approve" | "reopen") {
    setBusy(true);
    setMessage(null);
    const body: Record<string, unknown> = { action };
    if (action === "save" || action === "submit") {
      body.lines = lines.map((l) => ({
        item_id: l.item_id,
        counted_qty: values[l.item_id] === "" || values[l.item_id] === undefined ? null : Number(values[l.item_id]),
      }));
    }
    const res = await fetch(`/api/admin/stock/counts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMessage({ ok: false, text: data.error ?? "Could not save." });
    const done: Record<string, string> = {
      save: "Progress saved.",
      submit: "Sent for approval.",
      approve: `Approved. ${data.adjusted ?? 0} items were corrected.`,
      reopen: "Reopened for counting.",
    };
    setMessage({ ok: true, text: done[action] });
    await load();
  }

  async function remove() {
    if (!confirm("Delete this stock check? Nothing in stock changes.")) return;
    const res = await fetch(`/api/admin/stock/counts/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/stock/count");
  }

  if (!count) return message ? <Message ok={false}>{message.text}</Message> : <p className="text-sm text-muted">Loading...</p>;

  const variance = (l: Line) => {
    const v = values[l.item_id];
    if (v === "" || v === undefined) return null;
    return Number(v) - l.system_qty;
  };
  const varianceValue = lines.reduce((s, l) => s + (variance(l) ?? 0) * (l.avg_cost ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3 p-4 text-sm`}>
        <div>
          <p className="font-semibold">
            {count.scope === "All" ? "All items" : count.scope} - {shortDate(count.count_date)}{" "}
            <StatusBadge status={count.status} label={COUNT_STATUS_LABEL[count.status] ?? count.status} />
          </p>
          <p className="text-xs text-muted">
            Started by {count.created_by_name ?? count.created_by} {dateTime(count.created_at)}
            {count.submitted_by ? ` - sent by ${count.submitted_by}` : ""}
            {count.approved_by && count.approved_at ? ` - approved by ${count.approved_by} ${dateTime(count.approved_at)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnOutline}
            onClick={() =>
              downloadCountSheet(
                `${count.scope} ${count.count_date}`,
                lines
                  .map((l) => ({ ...l, counted_qty: values[l.item_id] === "" || values[l.item_id] === undefined ? null : Number(values[l.item_id]) }))
                  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
                manager
              )
            }
          >
            Download sheet (PDF)
          </button>
        </div>
      </div>

      <p className="text-sm">
        <strong>{counted}</strong> of {lines.length} items counted. Leave an item empty if you did not count it; only counted items
        are corrected.
        {manager && counted > 0 && (
          <span className="ml-1">
            Difference value: <strong className={varianceValue < 0 ? "text-red-600" : "text-green-700"}>{formatAed(varianceValue)}</strong>
          </span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find an item..." className={`${field} mt-0 max-w-sm`} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          Only not counted yet
        </label>
      </div>

      <ul className={`${card} divide-y divide-border`}>
        {visible.map((l) => {
          const v = variance(l);
          return (
            <li key={l.item_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="min-w-0">
                <span className="block truncate font-medium">{l.name}</span>
                <span className="block text-xs text-muted">
                  {l.category}
                  {manager || !editable ? ` - system ${formatQty(l.system_qty)} ${l.base_unit}` : ""}
                  {v !== null && v !== 0 && (manager || !editable) && (
                    <span className={v < 0 ? "text-red-600" : "text-green-700"}>
                      {" "}
                      ({v > 0 ? "+" : ""}
                      {formatQty(v)})
                    </span>
                  )}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  disabled={!editable}
                  value={values[l.item_id] ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, [l.item_id]: e.target.value }))}
                  className="w-24 rounded-md border border-border bg-background px-2 py-2 text-right text-sm disabled:opacity-70"
                />
                <span className="w-10 text-xs text-muted">{l.base_unit}</span>
              </span>
            </li>
          );
        })}
      </ul>

      {message && <Message ok={message.ok}>{message.text}</Message>}

      <div className="flex flex-wrap gap-3">
        {editable && (
          <>
            <button type="button" disabled={busy} onClick={() => send("save")} className={btnOutline}>
              Save progress
            </button>
            <button
              type="button"
              disabled={busy || counted === 0}
              onClick={() => confirm("Send this count for approval? You can't change it afterwards.") && send("submit")}
              className={btnPrimary}
            >
              Send for approval
            </button>
          </>
        )}
        {count.status === "submitted" && canApprove && (
          <button
            type="button"
            disabled={busy}
            onClick={() => confirm("Approve? Every counted item is set to its counted quantity.") && send("approve")}
            className={btnPrimary}
          >
            Approve and correct stock
          </button>
        )}
        {count.status === "submitted" && manager && (
          <button type="button" disabled={busy} onClick={() => send("reopen")} className={btnOutline}>
            Send back for recount
          </button>
        )}
        {count.status === "submitted" && manager && !canApprove && (
          <p className="text-sm text-muted">Another head or the owner must approve a count you started.</p>
        )}
        {count.status !== "approved" && manager && (
          <button type="button" onClick={remove} className={btnDanger}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
