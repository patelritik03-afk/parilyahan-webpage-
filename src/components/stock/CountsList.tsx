"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sortCategories } from "@/lib/stock/types";
import { COUNT_STATUS_LABEL, dateTime, shortDate, todayDubai } from "@/lib/stock/ops";
import { Message, StatusBadge, btnPrimary, card, field, label, postJson, useStockData } from "./ui";

type CountRow = {
  id: string;
  count_date: string;
  scope: string;
  status: string;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  stock_count_lines: { count: number }[];
};

export default function CountsList() {
  const router = useRouter();
  const { items } = useStockData();
  const [counts, setCounts] = useState<CountRow[] | null>(null);
  const [date, setDate] = useState(todayDubai());
  const [scope, setScope] = useState("All");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const categories = useMemo(() => sortCategories([...new Set((items ?? []).map((i) => i.category))]), [items]);

  useEffect(() => {
    fetch("/api/admin/stock/counts")
      .then((r) => r.json())
      .then((d) => setCounts(d.counts ?? []));
  }, []);

  async function start() {
    setBusy(true);
    setError("");
    const { ok, data } = await postJson("/api/admin/stock/counts", { date, scope });
    setBusy(false);
    if (!ok) return setError(data.error ?? "Could not start the count.");
    router.push(`/stock/count/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <div className={`${card} grid items-end gap-3 p-4 sm:grid-cols-3`}>
        <label className={label}>
          Count date
          <input type="date" value={date} max={todayDubai()} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        <label className={label}>
          What to count
          <select value={scope} onChange={(e) => setScope(e.target.value)} className={field}>
            <option value="All">All items</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={start} disabled={busy} className={btnPrimary}>
          {busy ? "Starting..." : "Start a stock check"}
        </button>
      </div>
      {error && <Message ok={false}>{error}</Message>}

      {counts === null ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : counts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">No stock checks yet.</p>
      ) : (
        <ul className={`${card} divide-y divide-border`}>
          {counts.map((c) => (
            <li key={c.id}>
              <Link href={`/stock/count/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background">
                <span className="min-w-0">
                  <span className="block font-medium">
                    {c.scope === "All" ? "All items" : c.scope} - {shortDate(c.count_date)}
                  </span>
                  <span className="block text-xs text-muted">
                    {c.stock_count_lines?.[0]?.count ?? 0} items - started by {c.created_by} {dateTime(c.created_at)}
                    {c.approved_by ? ` - approved by ${c.approved_by}` : ""}
                  </span>
                </span>
                <StatusBadge status={c.status} label={COUNT_STATUS_LABEL[c.status] ?? c.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
