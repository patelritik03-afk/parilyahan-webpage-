import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isStockManager, requireStock } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { addDaysISO, todayISO } from "@/lib/date";
import { isoDateSchema } from "@/lib/validation";
import { dateParam, dbError, displayNames, lineQty } from "@/lib/stock/server";

// Staff can enter or back-date usage up to this many days; heads and the owner any date.
const STAFF_BACKDATE_DAYS = 7;

const usageSchema = z.object({
  date: isoDateSchema,
  lines: z
    .array(
      z.object({
        item_id: z.uuid(),
        qty: lineQty,
        type: z.enum(["consumption", "wastage"]),
        reason: z.string().trim().max(60).optional().default(""),
        note: z.string().trim().max(200).optional().default(""),
      })
    )
    .min(1, "Add at least one item.")
    .max(200),
});

export async function GET(request: NextRequest) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const date = dateParam(request.nextUrl.searchParams.get("date")) ?? todayISO();
  const { data, error } = await supabaseAdmin
    .from("stock_movements")
    .select("id, item_id, type, qty, unit_cost, reason, note, created_by, created_at, stock_items(name, base_unit, category)")
    .eq("ref_type", "usage")
    .eq("entry_date", date)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json(dbError("Could not load usage", error), { status: 500 });
  const manager = isStockManager(auth.session);
  const name = await displayNames((data ?? []).map((e) => e.created_by));
  const entries = (data ?? []).map((e) => ({
    ...e,
    created_by: name(e.created_by),
    qty: -Number(e.qty),
    unit_cost: manager ? Number(e.unit_cost) : undefined,
    canDelete: manager || (e.created_by === auth.session.username && date === todayISO()),
  }));
  return NextResponse.json({ date, entries });
}

export async function POST(request: NextRequest) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const limited = await enforceRateLimit("stock-usage", request, { limit: 120, windowSec: 10 * 60 });
  if (limited) return limited;

  const parsed = usageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the entries." }, { status: 400 });
  }
  const { date, lines } = parsed.data;
  const today = todayISO();
  if (date > today) return NextResponse.json({ error: "The date cannot be in the future." }, { status: 400 });
  if (!isStockManager(auth.session) && date < addDaysISO(today, -STAFF_BACKDATE_DAYS)) {
    return NextResponse.json(
      { error: `Staff can enter usage for the last ${STAFF_BACKDATE_DAYS} days. Ask a head for older dates.` },
      { status: 403 }
    );
  }
  const missingReason = lines.find((l) => l.type === "wastage" && !l.reason);
  if (missingReason) return NextResponse.json({ error: "Choose a reason for each wastage entry." }, { status: 400 });

  const { data, error } = await supabaseAdmin.rpc("post_usage", { p_date: date, p_lines: lines, p_by: auth.session.username });
  if (error) return NextResponse.json(dbError("Could not save usage", error, "Could not save the entries."), { status: 400 });
  return NextResponse.json({ saved: data }, { status: 201 });
}
