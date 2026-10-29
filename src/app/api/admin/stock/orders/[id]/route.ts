import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isStockManager, requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isoDateSchema } from "@/lib/validation";
import { dbError, lineQty, notifyOwner } from "@/lib/stock/server";
import { formatOrderNumber } from "@/lib/stock/ops";

const patchSchema = z.object({
  action: z.enum(["update", "submit", "approve", "reject", "cancel"]),
  reason: z.string().trim().max(300).optional(),
  supplier_id: z.uuid().nullable().optional(),
  needed_by: isoDateSchema.nullable().optional(),
  notes: z.string().trim().max(500).optional(),
  lines: z
    .array(
      z.object({
        item_id: z.uuid(),
        qty: lineQty,
        unit: z.string().trim().min(1).max(20),
        est_price: z.number().min(0).max(1_000_000).nullable().optional(),
        note: z.string().trim().max(200).optional().default(""),
      })
    )
    .min(1)
    .max(200)
    .optional(),
});

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/stock/orders/[id]">) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const { id } = await ctx.params;
  const { data: order, error } = await supabaseAdmin
    .from("purchase_orders")
    .select("*, suppliers(name, contact_name, phone, email), purchase_order_lines(*, stock_items(name, base_unit, purchase_unit, purchase_factor, brand, pack_size))")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json(dbError("Could not load order", error), { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Display names for the people on the order.
  const usernames = [order.created_by, order.approved_by].filter(Boolean);
  const { data: people } = await supabaseAdmin.from("staff_users").select("username, display_name").in("username", usernames);
  const nameOf = (u: string | null) => (!u ? null : u === "owner" ? "Owner" : people?.find((p) => p.username === u)?.display_name ?? u);

  const manager = isStockManager(auth.session);
  const own = order.created_by === auth.session.username;
  return NextResponse.json({
    order: { ...order, created_by_name: nameOf(order.created_by), approved_by_name: nameOf(order.approved_by) },
    can: {
      edit: order.status === "draft" && (own || manager),
      submit: order.status === "draft" && (own || manager),
      approve: order.status === "submitted" && manager && (auth.session.role === "owner" || !own),
      cancel: (["draft", "submitted"].includes(order.status) && (own || manager)) || (order.status === "approved" && manager),
      receive: order.status === "approved",
    },
  });
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/stock/orders/[id]">) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the order." }, { status: 400 });
  const body = parsed.data;

  const { data: order } = await supabaseAdmin
    .from("purchase_orders")
    .select("id, number, status, created_by, suppliers(name), purchase_order_lines(count)")
    .eq("id", id)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const manager = isStockManager(auth.session);
  const own = order.created_by === auth.session.username;
  const now = new Date().toISOString();
  const deny = (message: string) => NextResponse.json({ error: message }, { status: 403 });
  const conflict = (message: string) => NextResponse.json({ error: message }, { status: 409 });

  if (body.action === "update" || body.action === "submit") {
    if (order.status !== "draft") return conflict("Only a draft order can be changed or sent.");
    if (!own && !manager) return deny("Only the person who made the order or a head can change it.");
    const update: Record<string, unknown> = {};
    if (body.supplier_id !== undefined) update.supplier_id = body.supplier_id;
    if (body.needed_by !== undefined) update.needed_by = body.needed_by;
    if (body.notes !== undefined) update.notes = body.notes || null;
    if (body.action === "submit") Object.assign(update, { status: "submitted", submitted_at: now });
    if (Object.keys(update).length) await supabaseAdmin.from("purchase_orders").update(update).eq("id", id);
    if (body.lines) {
      await supabaseAdmin.from("purchase_order_lines").delete().eq("order_id", id);
      const { error } = await supabaseAdmin
        .from("purchase_order_lines")
        .insert(body.lines.map((l) => ({ ...l, order_id: id, est_price: l.est_price ?? null, note: l.note || null })));
      if (error) return NextResponse.json(dbError("Could not save order lines", error), { status: 500 });
    }
    if (body.action === "submit") {
      const supplier = (order.suppliers as unknown as { name: string } | null)?.name ?? "No supplier";
      await notifyOwner(`Order ${formatOrderNumber(order.number)} needs approval`, "Order waiting for approval", [
        ["Order", formatOrderNumber(order.number)],
        ["From", auth.session.name],
        ["Supplier", supplier],
      ]);
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "approve" || body.action === "reject") {
    if (order.status !== "submitted") return conflict("Only an order waiting for approval can be approved or rejected.");
    if (!manager) return deny("Only a head or the owner can approve orders.");
    if (own && auth.session.role !== "owner") return deny("Another head or the owner must approve an order you made.");
    const update =
      body.action === "approve"
        ? { status: "approved", approved_by: auth.session.username, approved_at: now }
        : { status: "rejected", approved_by: auth.session.username, approved_at: now, reject_reason: body.reason || null };
    await supabaseAdmin.from("purchase_orders").update(update).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  // cancel
  const canCancel = (["draft", "submitted"].includes(order.status) && (own || manager)) || (order.status === "approved" && manager);
  if (!canCancel) return deny("This order cannot be cancelled.");
  await supabaseAdmin.from("purchase_orders").update({ status: "cancelled" }).eq("id", id);
  return NextResponse.json({ ok: true });
}
