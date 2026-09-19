"use client";

import { useEffect, useState } from "react";
import { todayISO } from "@/lib/date";
import type { Reservation } from "@/lib/types";

export default function ReservationsList() {
  const [date, setDate] = useState(todayISO());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = date ? `?date=${date}` : "";
    Promise.resolve()
      .then(() => setLoading(true))
      .then(() => fetch(`/api/admin/reservations${params}`))
      .then((res) => res.json())
      .then((data) => setReservations(data.reservations ?? []))
      .finally(() => setLoading(false));
  }, [date]);

  const totalGuests = reservations.reduce((sum, r) => sum + r.party_size, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-foreground/80" htmlFor="date-filter">
          Date
        </label>
        <input
          id="date-filter"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setDate("")}
          className="text-sm font-medium text-muted hover:text-primary"
        >
          Show all
        </button>
        {!loading && (
          <span className="ml-auto text-sm text-muted">
            {reservations.length} reservation{reservations.length === 1 ? "" : "s"} · {totalGuests} guests
          </span>
        )}
      </div>

      <div className="mt-6 overflow-x-auto">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : reservations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
            No reservations for this date.
          </p>
        ) : (
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Party</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4">{r.time}</td>
                  <td className="py-2 pr-4 font-medium">{r.name}</td>
                  <td className="py-2 pr-4">{r.party_size}</td>
                  <td className="py-2 pr-4">{r.phone}</td>
                  <td className="py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4 text-muted">{r.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
