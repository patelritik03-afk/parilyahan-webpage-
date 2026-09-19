import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { sendOwnerReservationEmail, sendCustomerConfirmationEmail } from "@/lib/email";
import { sendOwnerWhatsAppNotification } from "@/lib/whatsapp";
import { logFailures } from "@/lib/notify";
import { enforceRateLimit } from "@/lib/rateLimit";
import { isHoneypotFilled, upcomingDateSchema } from "@/lib/validation";
import { TIME_SLOTS } from "@/lib/timeSlots";
import type { Reservation } from "@/lib/types";

const MAX_DAYS_AHEAD = 90;

const reservationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().regex(/^\+\d{1,4} \d{5,14}$/, "Enter a valid mobile number."),
  email: z.string().trim().email().max(200),
  date: upcomingDateSchema(MAX_DAYS_AHEAD, "Please choose a date from today up to 90 days ahead."),
  time: z.string().refine((val) => TIME_SLOTS.includes(val), "Please choose a valid time slot."),
  party_size: z.number().int().min(1).max(50),
  notes: z.string().trim().max(1000).optional().default(""),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit("reservations", request, { limit: 5, windowSec: 10 * 60 });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (isHoneypotFilled(body)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.find((i) => i.path[0] === "date")?.message;
    return NextResponse.json({ error: message ?? "Please check the form and try again." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .insert({ ...parsed.data, status: "confirmed" })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to save reservation", error);
    return NextResponse.json({ error: "Could not save your reservation." }, { status: 500 });
  }

  const reservation = data as Reservation;

  const results = await Promise.allSettled([
    sendOwnerReservationEmail(reservation),
    sendCustomerConfirmationEmail(reservation),
    sendOwnerWhatsAppNotification(reservation),
  ]);
  logFailures("Reservation notification", results);

  return NextResponse.json({ reservation }, { status: 201 });
}
