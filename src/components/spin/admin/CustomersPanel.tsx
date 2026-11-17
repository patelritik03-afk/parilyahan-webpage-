"use client";

import { useEffect, useState } from "react";
import { fmtDateTime } from "./shared";

type Customer = {
  id: string;
  full_name: string;
  phone: string;
  consent: boolean;
  verified: boolean;
  last_seen: string;
  sources: string[];
  prizes: string[];
  redeemed: number;
  active: number;
};

const field = "rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

export default function CustomersPanel() {
  const [q, setQ] = useState("");
  const [consent, setConsent] = useState(false);
  const [all, setAll] = useState(false);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (consent) p.set("consent", "1");
      if (all) p.set("all", "1");
      setQuery(p.toString());
    }, 300);
    return () => clearTimeout(t);
  }, [q, consent, all]);

  useEffect(() => {
    let stop = false;
    fetch(`/api/admin/spin/customers?${query}`)
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (stop) return;
        if (r.ok) setCustomers(json.customers);
        else setError(json.error ?? "Could not load.");
      })
      .catch(() => !stop && setError("Could not load."));
    return () => {
      stop = true;
    };
  }, [query]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input className={`${field} min-w-0 flex-1`} placeholder="Search name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
        <a
          href={`/api/admin/spin/customers/export?${query}`}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Download Excel
        </a>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          Only people who agreed to WhatsApp offers
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
          Include numbers that never finished verifying
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {!customers ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted">
            {customers.length} customer{customers.length === 1 ? "" : "s"} · {customers.filter((c) => c.consent).length} agreed to offers
          </p>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Mobile</th>
                  <th className="px-3 py-2">Won</th>
                  <th className="px-3 py-2">From</th>
                  <th className="px-3 py-2">Offers</th>
                  <th className="px-3 py-2">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">
                      {c.full_name}
                      {!c.verified && <span className="ml-1 text-xs text-muted">(not verified)</span>}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{c.phone}</td>
                    <td className="px-3 py-2">
                      {c.prizes.join(", ") || "—"}
                      {c.redeemed > 0 && <span className="ml-1 text-xs text-blue-800">({c.redeemed} used)</span>}
                    </td>
                    <td className="px-3 py-2">{c.sources.join(", ")}</td>
                    <td className="px-3 py-2">{c.consent ? "✅" : "—"}</td>
                    <td className="px-3 py-2 text-muted">{fmtDateTime(c.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
