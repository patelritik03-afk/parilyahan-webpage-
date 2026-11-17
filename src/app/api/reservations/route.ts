import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { sendOwnerReservationEmail, sendCustomerConfirmationEmail } from "@/lib/email";
import { sendOwnerWhatsAppNotification } from "@/lib/whatsapp";
import { logFailures } from "@/lib/notify";
import { enforceRateLimit } from "@/lib/rateLimit";
import { isHoneypotFilled, optionalEmailSchema, upcomingDateSchema } from "@/lib/validation";
import { TIME_SLOTS } from "@/lib/timeSlots";
import type { Reservation } from "@/lib/types";
import { couponStatus } from "@/lib/spin/server";
import { formatCouponCode } from "@/lib/spin/text";

const MAX_DAYS_AHEAD = 90;

const reservationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().regex(/^\+\d{1,4} \d{5,14}$/, "Enter a valid mobile number."),
  email: optionalEmailSchema,
  date: upcomingDateSchema(MAX_DAYS_AHEAD, "Please choose a date from today up to 90 days ahead."),
  time: z.string().refine((val) => TIME_SLOTS.includes(val), "Please choose a valid time slot."),
  party_size: z.number().int().min(1).max(50),
  notes: z.string().trim().max(1000).optional().default(""),
  coupon_code: z.string().trim().max(30).optional().default(""),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit("reservations", request, { limit: 10, windowSec: 10 * 60 });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (isHoneypotFilled(body)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.find((i) => i.path[0] === "date" || i.path[0] === "email")?.message;
    return NextResponse.json({ error: message ?? "Please check the form and try again." }, { status: 400 });
  }

  // A Spin & Win code is only kept when it is real and unused; a bad code never blocks the booking.
  const { coupon_code: rawCoupon, ...fields } = parsed.data;
  let coupon: { id: string; code: string } | null = null;
  const code = rawCoupon ? formatCouponCode(rawCoupon) : null;
  if (code) {
    const { data: found } = await supabaseAdmin.from("spin_coupons").select("id, code, expires_on, redeemed_at").eq("code", code).maybeSingle();
    if (found && couponStatus(found) === "active") coupon = { id: found.id, code: found.code };
  }

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .insert({ ...fields, coupon_code: coupon?.code ?? null, status: "confirmed" })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to save reservation", error);
    return NextResponse.json({ error: "Could not save your reservation." }, { status: 500 });
  }

  const reservation = data as Reservation;
  if (coupon) {
    await supabaseAdmin.from("spin_coupons").update({ reservation_id: reservation.id }).eq("id", coupon.id).is("reservation_id", null);
  }

  const results = await Promise.allSettled([
    sendOwnerReservationEmail(reservation),
    sendCustomerConfirmationEmail(reservation),
    sendOwnerWhatsAppNotification(reservation),
  ]);
  logFailures("Reservation notification", results);

  return NextResponse.json({ reservation }, { status: 201 });
}
