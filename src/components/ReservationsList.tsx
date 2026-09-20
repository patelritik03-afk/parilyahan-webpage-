"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDaysISO, monthRangeISO, todayISO } from "@/lib/date";
import { RESERVATION_STATUSES, statusLabel } from "@/lib/reservationStatus";
import { TIME_SLOTS, formatTimeLabel } from "@/lib/timeSlots";
import { downloadReservationsPdf, printReservationsReport } from "@/lib/reservationReport";
import type { Reservation } from "@/lib/types";
import ReservationEditor from "./ReservationEditor";

type Filters = { from: string; to: string; status: string; time: string; q: string };

const fieldClass = "rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none";
const buttonClass =
  "rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary disabled:opacity-50";

function presets(today: string): { label: string; from: string; to: string }[] {
  const month = monthRangeISO(today);
  return [
    { label: "Today", from: today, to: today },
    { label: "Tomorrow", from: addDaysISO(today, 1), to: addDaysISO(today, 1) },
    { label: "Next 7 days", from: today, to: addDaysISO(today, 6) },
    { label: "This month", from: month.from, to: month.to },
    { label: "Upcoming", from: today, to: "" },
    { label: "All", from: "", to: "" },
  ];
}

function toQuery(f: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(f)) if (value) params.set(key, value);
  return params.toString();
}

function describe(f: Filters) {
  const parts = [
    f.from || f.to ? `Date ${f.from || "start"} to ${f.to || "end"}` : "All dates",
    f.status ? `Status ${statusLabel(f.status)}` : "Any status",
    f.time ? `Time ${formatTimeLabel(f.time)}` : "Any time",
  ];
  if (f.q) parts.push(`Search "${f.q}"`);
  return parts.join(" | ");
}

export default function ReservationsList() {
  const today = useMemo(() => todayISO(), []);
  const [filters, setFilters] = useState<Filters>({ from: today, to: "", status: "", time: "", q: "" });
  const [query, setQuery] = useState(toQuery(filters));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [busy, setBusy] = useState(false);

  // Typing in the search box waits a moment so we do not ask the server on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(toQuery(filters)), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reservations?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReservations(data.reservations ?? []);
    } catch {
      setError("Could not load reservations.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const totalGuests = reservations.reduce((sum, r) => sum + r.party_size, 0);
  const update = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch }));
  const activePreset = presets(today).find((p) => p.from === filters.from && p.to === filters.to)?.label;

  async function handleDelete(r: Reservation) {
    if (!confirm(`Delete the reservation for ${r.name} on ${r.date} at ${formatTimeLabel(r.time)}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/reservations/${r.id}`, { method: "DELETE" });
    if (res.ok) await load();
    else setError("Could not delete the reservation.");
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch {
      setError("Could not create the report.");
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || loading || reservations.length === 0;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {presets(today).map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => update({ from: p.from, to: p.to })}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activePreset === p.label ? "bg-primary text-primary-foreground" : "bg-surface text-foreground/80 hover:text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-medium text-muted">
          From
          <input type="date" value={filters.from} onChange={(e) => update({ from: e.target.value })} className={`mt-1 block w-full ${fieldClass}`} />
        </label>
        <label className="text-xs font-medium text-muted">
          To
          <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => update({ to: e.target.value })} className={`mt-1 block w-full ${fieldClass}`} />
        </label>
        <label className="text-xs font-medium text-muted">
          Status
          <select value={filters.status} onChange={(e) => update({ status: e.target.value })} className={`mt-1 block w-full ${fieldClass}`}>
            <option value="">Any status</option>
            {RESERVATION_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted">
          Time
          <select value={filters.time} onChange={(e) => update({ time: e.target.value })} className={`mt-1 block w-full ${fieldClass}`}>
            <option value="">Any time</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{formatTimeLabel(slot)}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted">
          Search
          <input type="search" placeholder="Name, phone, email, notes" value={filters.q} onChange={(e) => update({ q: e.target.value })} className={`mt-1 block w-full ${fieldClass}`} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">
          {loading ? "Loading..." : `${reservations.length} reservation${reservations.length === 1 ? "" : "s"} | ${totalGuests} guests`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <a
            href={disabled ? undefined : `/api/admin/reservations/export?${query}`}
            aria-disabled={disabled}
            className={`${buttonClass} ${disabled ? "pointer-events-none opacity-50" : ""}`}
          >
            Download Excel
          </a>
          <button type="button" disabled={disabled} className={buttonClass}
            onClick={() => run(() => downloadReservationsPdf(reservations, describe(filters)))}>
            Download PDF
          </button>
          <button type="button" disabled={disabled} className={buttonClass}
            onClick={() => run(() => printReservationsReport(reservations, describe(filters)))}>
            Print report
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto">
        {loading ? null : reservations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
            No reservations match these filters.
          </p>
        ) : (
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Guests</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Notes</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className={`border-b border-border/60 ${r.status === "cancelled" ? "text-muted line-through" : ""}`}>
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4">{formatTimeLabel(r.time)}</td>
                  <td className="py-2 pr-4 font-medium">{r.name}</td>
                  <td className="py-2 pr-4">{r.party_size}</td>
                  <td className="py-2 pr-4">{r.phone}</td>
                  <td className="py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4">{statusLabel(r.status)}</td>
                  <td className="py-2 pr-4 text-muted">{r.notes || "-"}</td>
                  <td className="whitespace-nowrap py-2 text-right">
                    <button type="button" onClick={() => setEditing(r)} className="mr-3 font-medium text-primary hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(r)} className="font-medium text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ReservationEditor
          reservation={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
