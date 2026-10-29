import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStock } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { isoDateSchema } from "@/lib/validation";
import { dateParam, dbError, displayNames, lineQty, notifyOwner } from "@/lib/stock/server";
import { formatOrderNumber } from "@/lib/stock/ops";

const orderLinesSchema = z
  .array(
    z.object({
      item_id: z.uuid(),
      qty: lineQty,
      unit: z.string().trim().min(1).max(20),
      est_price: z.number().min(0).max(1_000_000).nullable().optional(),
      note: z.string().trim().max(200).optional().default(""),
    })
  )
  .min(1, "Add at least one item.")
  .max(200);

const createSchema = z.object({
  supplier_id: z.uuid().nullable().optional(),
  needed_by: isoDateSchema.nullable().optional(),
  notes: z.string().trim().max(500).optional().default(""),
  submit: z.boolean().optional().default(false),
  lines: orderLinesSchema,
});

export async function GET(request: NextRequest) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const params = request.nextUrl.searchParams;
  let query = supabaseAdmin
    .from("purchase_orders")
    .select("id, number, status, needed_by, created_by, created_at, submitted_at, approved_by, approved_at, supplier_id, suppliers(name), purchase_order_lines(count)")
    .order("number", { ascending: false })
    .limit(300);
  if (params.get("status")) query = query.eq("status", params.get("status")!);
  if (params.get("supplier")) query = query.eq("supplier_id", params.get("supplier")!);
  const from = dateParam(params.get("from"));
  const to = dateParam(params.get("to"));
  if (from) query = query.gte("created_at", `${from}T00:00:00+04:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59+04:00`);
  const { data, error } = await query;
  if (error) return NextResponse.json(dbError("Could not list orders", error), { status: 500 });
  const name = await displayNames((data ?? []).flatMap((o) => [o.created_by, o.approved_by]));
  return NextResponse.json({
    orders: (data ?? []).map((o) => ({ ...o, created_by: name(o.created_by), approved_by: name(o.approved_by) })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const limited = await enforceRateLimit("stock-orders", request, { limit: 60, windowSec: 10 * 60 });
  if (limited) return limited;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the order." }, { status: 400 });
  }
  const { lines, submit, ...header } = parsed.data;
  const now = new Date().toISOString();
  const { data: order, error } = await supabaseAdmin
    .from("purchase_orders")
    .insert({
      supplier_id: header.supplier_id ?? null,
      needed_by: header.needed_by ?? null,
      notes: header.notes || null,
      status: submit ? "submitted" : "draft",
      submitted_at: submit ? now : null,
      created_by: auth.session.username,
    })
    .select("id, number, suppliers(name)")
    .single();
  if (error) return NextResponse.json(dbError("Could not create order", error), { status: 500 });

  const { error: linesError } = await supabaseAdmin
    .from("purchase_order_lines")
    .insert(lines.map((l) => ({ ...l, order_id: order.id, est_price: l.est_price ?? null, note: l.note || null })));
  if (linesError) {
    await supabaseAdmin.from("purchase_orders").delete().eq("id", order.id);
    return NextResponse.json(dbError("Could not save order lines", linesError), { status: 500 });
  }

  if (submit) {
    const supplier = (order.suppliers as unknown as { name: string } | null)?.name ?? "No supplier";
    await notifyOwner(`Order ${formatOrderNumber(order.number)} needs approval`, `New order waiting for approval`, [
      ["Order", formatOrderNumber(order.number)],
      ["From", auth.session.name],
      ["Supplier", supplier],
      ["Items", String(lines.length)],
    ]);
  }
  return NextResponse.json({ id: order.id, number: order.number }, { status: 201 });
}
