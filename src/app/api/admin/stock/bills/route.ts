import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStock } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { todayISO } from "@/lib/date";
import { isoDateSchema } from "@/lib/validation";
import { dateParam, dbError, displayNames, getPriceAlertPct, lineQty, notifyOwner } from "@/lib/stock/server";
import { formatAed } from "@/lib/stock/types";

const billSchema = z.object({
  supplier_id: z.uuid().nullable().optional(),
  bill_no: z.string().trim().max(60).optional().default(""),
  bill_date: isoDateSchema,
  notes: z.string().trim().max(500).optional().default(""),
  photo_path: z.string().max(200).regex(/^bills\/[\w./-]+$/).nullable().optional(),
  order_id: z.uuid().nullable().optional(),
  lines: z
    .array(
      z.object({
        item_id: z.uuid(),
        qty: lineQty,
        unit: z.string().trim().min(1).max(20),
        unit_price: z.number().min(0).max(1_000_000),
      })
    )
    .min(1, "Add at least one item.")
    .max(200),
});

export async function GET(request: NextRequest) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const params = request.nextUrl.searchParams;
  let query = supabaseAdmin
    .from("purchase_bills")
    .select("id, bill_no, bill_date, total, created_by, created_at, photo_path, order_id, supplier_id, suppliers(name), purchase_bill_lines(count)")
    .order("bill_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  const from = dateParam(params.get("from"));
  const to = dateParam(params.get("to"));
  if (from) query = query.gte("bill_date", from);
  if (to) query = query.lte("bill_date", to);
  if (params.get("supplier")) query = query.eq("supplier_id", params.get("supplier")!);
  const { data, error } = await query;
  if (error) return NextResponse.json(dbError("Could not list bills", error), { status: 500 });
  const name = await displayNames((data ?? []).map((b) => b.created_by));
  return NextResponse.json({ bills: (data ?? []).map((b) => ({ ...b, created_by: name(b.created_by) })) });
}

export async function POST(request: NextRequest) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const limited = await enforceRateLimit("stock-bills", request, { limit: 60, windowSec: 10 * 60 });
  if (limited) return limited;

  const parsed = billSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the bill." }, { status: 400 });
  }
  const bill = parsed.data;
  if (bill.bill_date > todayISO()) return NextResponse.json({ error: "The bill date cannot be in the future." }, { status: 400 });

  const pct = await getPriceAlertPct();
  const { lines, ...header } = bill;
  const { data, error } = await supabaseAdmin.rpc("post_bill", {
    p_bill: header,
    p_lines: lines,
    p_by: auth.session.username,
    p_alert_pct: pct,
  });
  if (error) return NextResponse.json(dbError("Could not save bill", error, "Could not save the bill."), { status: 400 });

  const result = data as { bill_id: string; alerts: number; total: number };
  if (result.alerts > 0) {
    const { data: alerts } = await supabaseAdmin
      .from("price_alerts")
      .select("old_cost, new_cost, change_pct, stock_items(name, base_unit), suppliers(name)")
      .eq("bill_id", result.bill_id);
    const rows: [string, string][] = (alerts ?? []).map((a) => {
      const item = a.stock_items as unknown as { name: string; base_unit: string } | null;
      return [
        item?.name ?? "Item",
        `${formatAed(Number(a.old_cost))} -> ${formatAed(Number(a.new_cost))} per ${item?.base_unit ?? "unit"} (+${a.change_pct}%)`,
      ];
    });
    const supplier = (alerts?.[0]?.suppliers as unknown as { name: string } | null)?.name;
    await notifyOwner(
      `Price alert: ${result.alerts} item(s) went up${supplier ? ` at ${supplier}` : ""}`,
      `Price rise on a bill entered by ${auth.session.name}${supplier ? ` (${supplier})` : ""}`,
      rows
    );
  }
  return NextResponse.json(result, { status: 201 });
}
