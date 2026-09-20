import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { findReservations } from "@/lib/reservationsQuery";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const reservations = await findReservations(request.nextUrl.searchParams);
  if (!reservations) {
    return NextResponse.json({ error: "Could not load reservations" }, { status: 500 });
  }
  return NextResponse.json({ reservations });
}
