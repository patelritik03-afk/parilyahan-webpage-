import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { sendOwnerReservationEmail, sendCustomerConfirmationEmail } from "@/lib/email";
import { sendOwnerWhatsAppNotification } from "@/lib/whatsapp";
import { logFailures } from "@/lib/notify";
import { TIME_SLOTS } from "@/lib/timeSlots";
import type { Reservation } from "@/lib/types";

const reservationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().regex(/^\+\d{1,4} \d{5,14}$/, "Enter a valid mobile number."),
  email: z.string().trim().email(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().refine((val) => TIME_SLOTS.includes(val), "Please choose a valid time slot."),
  party_size: z.number().int().min(1).max(50),
  notes: z.string().trim().max(1000).optional().default(""),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = reservationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
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
