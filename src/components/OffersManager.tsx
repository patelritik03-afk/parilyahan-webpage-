"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Offer } from "@/lib/offers";

const inputClass = "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none";
const emptyForm = { title: "", price: "", note: "Exclusive of taxes", description: "" };

export default function OffersManager() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/offers");
    const data = await res.json().catch(() => ({}));
    setOffers(data.offers ?? []);
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        price: Number(form.price),
        note: form.note,
        description: form.description,
        sort_order: offers?.length ?? 0,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setForm(emptyForm);
      setMessage({ ok: true, text: "Offer added." });
      await load();
    } else {
      setMessage({ ok: false, text: data.error ?? "Could not add the offer." });
    }
  }

  async function toggleActive(offer: Offer) {
    const res = await fetch(`/api/admin/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !offer.active }),
    });
    if (res.ok) await load();
  }

  async function handleRemove(offer: Offer) {
    if (!confirm(`Remove "${offer.title}"?`)) return;
    const res = await fetch(`/api/admin/offers/${offer.id}`, { method: "DELETE" });
    if (res.ok) await load();
    else setMessage({ ok: false, text: "Could not remove the offer." });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="max-w-xl space-y-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Add an offer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground/80">
            Title
            <input required placeholder="e.g. Weekend Buffet" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80">
            Price (AED)
            <input required type="number" min={0} step="0.01" value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80 sm:col-span-2">
            Note (shown next to the price)
            <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80 sm:col-span-2">
            Description (optional)
            <textarea rows={2} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} />
          </label>
        </div>
        {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
        <button type="submit" disabled={busy}
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {busy ? "Adding..." : "Add offer"}
        </button>
      </form>

      {offers === null ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : offers.length === 0 ? (
        <p className="text-sm text-muted">No offers yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {offers.map((offer) => (
            <li key={offer.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className={offer.active ? "" : "opacity-50"}>
                <p className="font-medium">
                  {offer.title} - AED {offer.price}
                </p>
                {offer.note && <p className="text-xs text-muted">{offer.note}</p>}
              </div>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => toggleActive(offer)} className="text-sm font-medium text-primary hover:underline">
                  {offer.active ? "Hide from site" : "Show on site"}
                </button>
                <button type="button" onClick={() => handleRemove(offer)} className="text-sm font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
