import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { dbError, getPriceAlertPct, setPriceAlertPct } from "@/lib/stock/server";

const patchSchema = z.object({
  pct: z.number().min(0).max(500).optional(),
  seenIds: z.array(z.uuid()).max(500).optional(),
  allSeen: z.boolean().optional(),
});

// Price alerts and the alert threshold: heads and the owner only.
export async function GET() {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;
  const [pct, { data, error }] = await Promise.all([
    getPriceAlertPct(),
    supabaseAdmin
      .from("price_alerts")
      .select("id, item_id, old_cost, new_cost, change_pct, seen_by, seen_at, created_at, bill_id, stock_items(name, base_unit), suppliers(name), purchase_bills(bill_date, bill_no)")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (error) return NextResponse.json(dbError("Could not load price alerts", error), { status: 500 });
  return NextResponse.json({ pct, alerts: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the values." }, { status: 400 });
  const { pct, seenIds, allSeen } = parsed.data;
  if (pct !== undefined && !(await setPriceAlertPct(pct))) {
    return NextResponse.json({ error: "Could not save the setting." }, { status: 500 });
  }
  const seen = { seen_by: auth.session.username, seen_at: new Date().toISOString() };
  if (allSeen) await supabaseAdmin.from("price_alerts").update(seen).is("seen_at", null);
  else if (seenIds?.length) await supabaseAdmin.from("price_alerts").update(seen).in("id", seenIds);
  return NextResponse.json({ ok: true });
}
