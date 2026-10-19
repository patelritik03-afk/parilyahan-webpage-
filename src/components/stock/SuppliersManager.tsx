"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Supplier } from "@/lib/stock/types";

const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";
const labelClass = "text-sm font-medium text-foreground/80";

type Draft = { name: string; contact_name: string; phone: string; email: string; notes: string; active: boolean };
const emptyDraft: Draft = { name: "", contact_name: "", phone: "", email: "", notes: "", active: true };

const toDraft = (s: Supplier): Draft => ({
  name: s.name,
  contact_name: s.contact_name ?? "",
  phone: s.phone ?? "",
  email: s.email ?? "",
  notes: s.notes ?? "",
  active: s.active,
});

export default function SuppliersManager({ canManage }: { canManage: boolean }) {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/stock/suppliers");
    const data = await res.json().catch(() => ({}));
    setSuppliers(data.suppliers ?? []);
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  async function save(id: string | null, draft: Draft) {
    const res = await fetch(id ? `/api/admin/stock/suppliers/${id}` : "/api/admin/stock/suppliers", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error ?? "Could not save.";
    setEditing(null);
    await load();
    return null;
  }

  if (suppliers === null) return <p className="text-sm text-muted">Loading suppliers...</p>;

  return (
    <div className="space-y-5">
      {canManage && editing !== "new" && (
        <button type="button" onClick={() => setEditing("new")} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
          + Add supplier
        </button>
      )}
      {editing === "new" && <SupplierForm initial={emptyDraft} onSave={(d) => save(null, d)} onCancel={() => setEditing(null)} />}

      {suppliers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">No suppliers yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {suppliers.map((s) => (
            <li key={s.id} className={s.active ? "" : "opacity-50"}>
              {editing === s.id ? (
                <div className="p-3">
                  <SupplierForm initial={toDraft(s)} onSave={(d) => save(s.id, d)} onCancel={() => setEditing(null)} />
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {s.name}
                      {!s.active && <span className="ml-2 text-xs font-semibold text-red-600">not used</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {[s.contact_name, s.phone, s.email].filter(Boolean).join(" - ") || "No contact details"}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm font-medium">
                    {s.phone && (
                      <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                        Call
                      </a>
                    )}
                    {canManage && (
                      <button type="button" onClick={() => setEditing(s.id)} className="text-primary hover:underline">
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SupplierForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Draft;
  onSave: (draft: Draft) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError((await onSave(draft)) ?? "");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Supplier name
          <input required maxLength={120} value={draft.name} onChange={(e) => set("name", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Contact person
          <input maxLength={80} value={draft.contact_name} onChange={(e) => set("contact_name", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Phone / WhatsApp
          <input type="tel" maxLength={40} value={draft.phone} onChange={(e) => set("phone", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Email
          <input type="email" maxLength={200} value={draft.email} onChange={(e) => set("email", e.target.value)} className={fieldClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Notes (delivery days, payment terms...)
          <input maxLength={500} value={draft.notes} onChange={(e) => set("notes", e.target.value)} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          We still buy from them
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-4">
        <button type="submit" disabled={busy} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-primary">
          Cancel
        </button>
      </div>
    </form>
  );
}
