import "server-only";
import { supabaseAdmin } from "./supabase";
import { isoDateSchema } from "./validation";
import { TIME_SLOTS } from "./timeSlots";
import { RESERVATION_STATUSES } from "./reservationStatus";
import type { Reservation } from "./types";

// The list screen and the Excel export read the same filters, so they always agree.
export async function findReservations(params: URLSearchParams): Promise<Reservation[] | null> {
  const from = params.get("from");
  const to = params.get("to");
  const status = params.get("status");
  const time = params.get("time");
  const q = params.get("q")?.trim().toLowerCase() ?? "";

  let query = supabaseAdmin
    .from("reservations")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .order("created_at", { ascending: true });

  if (from && isoDateSchema.safeParse(from).success) query = query.gte("date", from);
  if (to && isoDateSchema.safeParse(to).success) query = query.lte("date", to);
  if (status && (RESERVATION_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (time && TIME_SLOTS.includes(time)) query = query.eq("time", time);

  const { data, error } = await query;
  if (error) {
    console.error("Could not load reservations", error);
    return null;
  }

  const rows = (data ?? []) as Reservation[];
  if (!q) return rows;
  return rows.filter((r) => [r.name, r.phone, r.email, r.notes ?? ""].some((v) => v.toLowerCase().includes(q)));
}
