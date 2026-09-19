import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { isoDateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const dateParam = request.nextUrl.searchParams.get("date");
  const date = dateParam && isoDateSchema.safeParse(dateParam).success ? dateParam : null;

  let query = supabaseAdmin
    .from("reservations")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (date) {
    query = query.eq("date", date);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Could not load reservations" }, { status: 500 });
  }

  return NextResponse.json({ reservations: data ?? [] });
}
