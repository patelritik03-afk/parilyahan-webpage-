import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { isoDateSchema } from "@/lib/validation";
import { TIME_SLOTS } from "@/lib/timeSlots";
import { RESERVATION_STATUSES } from "@/lib/reservationStatus";

// Staff can correct past bookings too, so the date only has to be a real date.
const patchSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(200),
  date: isoDateSchema,
  time: z.string().refine((val) => TIME_SLOTS.includes(val), "Please choose a valid time slot."),
  party_size: z.number().int().min(1).max(500),
  notes: z.string().trim().max(1000).optional().default(""),
  status: z.enum(RESERVATION_STATUSES),
});

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/reservations/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the details and try again." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    console.error("Could not update reservation", error);
    return NextResponse.json({ error: "Could not save the changes." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Reservation not found." }, { status: 404 });

  return NextResponse.json({ reservation: data });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/reservations/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const { error } = await supabaseAdmin.from("reservations").delete().eq("id", id);
  if (error) {
    console.error("Could not delete reservation", error);
    return NextResponse.json({ error: "Could not delete the reservation." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
