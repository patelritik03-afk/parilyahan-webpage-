"use client";

import { useState, type FormEvent } from "react";
import { RESERVATION_STATUSES, statusLabel } from "@/lib/reservationStatus";
import { TIME_SLOTS, formatTimeLabel } from "@/lib/timeSlots";
import type { Reservation } from "@/lib/types";

const inputClass = "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none";

export default function ReservationEditor({
  reservation,
  onClose,
  onSaved,
}: {
  reservation: Reservation;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    name: reservation.name,
    phone: reservation.phone,
    email: reservation.email,
    date: reservation.date,
    time: reservation.time,
    party_size: String(reservation.party_size),
    status: reservation.status,
    notes: reservation.notes ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  // A booking made at an older time slot still shows in the list even if it is no longer offered.
  const timeOptions = TIME_SLOTS.includes(form.time) ? TIME_SLOTS : [form.time, ...TIME_SLOTS];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/reservations/${reservation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, party_size: Number(form.party_size) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) await onSaved();
    else setError(data.error ?? "Could not save the changes.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-background p-6 shadow-xl">
        <h2 className="font-display text-xl font-bold">Edit reservation</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground/80 sm:col-span-2">
            Name
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80">
            Phone
            <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80">
            Email
            <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80">
            Date
            <input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80">
            Time
            <select value={form.time} onChange={(e) => set("time", e.target.value)} className={inputClass}>
              {timeOptions.map((slot) => (
                <option key={slot} value={slot}>{formatTimeLabel(slot)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground/80">
            Guests
            <input required type="number" min={1} max={500} value={form.party_size} onChange={(e) => set("party_size", e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-foreground/80">
            Status
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
              {RESERVATION_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground/80 sm:col-span-2">
            Notes
            <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
          </label>
        </div>
        <p className="text-xs text-muted">Changes here do not email the customer. Contact them directly if the time changes.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2 text-sm font-medium text-muted hover:text-primary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
