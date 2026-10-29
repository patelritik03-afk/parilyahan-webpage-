import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isStockManager, requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { dbError, displayNames } from "@/lib/stock/server";

const patchSchema = z.object({
  action: z.enum(["save", "submit", "approve", "reopen"]),
  lines: z
    .array(z.object({ item_id: z.uuid(), counted_qty: z.number().min(0).max(1_000_000).nullable() }))
    .max(3000)
    .optional(),
});

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/stock/counts/[id]">) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const { id } = await ctx.params;
  const { data: count, error } = await supabaseAdmin.from("stock_counts").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json(dbError("Could not load count", error), { status: 500 });
  if (!count) return NextResponse.json({ error: "Count not found." }, { status: 404 });
  const { data: lines } = await supabaseAdmin
    .from("stock_count_lines")
    .select("item_id, system_qty, counted_qty, stock_items(name, base_unit, category, sub_category, avg_cost)")
    .eq("count_id", id)
    .range(0, 2999);
  const manager = isStockManager(auth.session);
  const name = await displayNames([count.created_by, count.submitted_by, count.approved_by]);
  return NextResponse.json({
    count: {
      ...count,
      created_by_name: name(count.created_by),
      submitted_by: name(count.submitted_by),
      approved_by: name(count.approved_by),
    },
    manager,
    canApprove: manager && (auth.session.role === "owner" || count.created_by !== auth.session.username),
    lines: (lines ?? []).map((l) => {
      const item = l.stock_items as unknown as { name: string; base_unit: string; category: string; sub_category: string | null; avg_cost: number };
      return {
        item_id: l.item_id,
        system_qty: Number(l.system_qty),
        counted_qty: l.counted_qty === null ? null : Number(l.counted_qty),
        name: item.name,
        base_unit: item.base_unit,
        category: item.category,
        sub_category: item.sub_category,
        avg_cost: manager ? Number(item.avg_cost) : undefined,
      };
    }),
  });
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/stock/counts/[id]">) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the counts." }, { status: 400 });
  const { action, lines } = parsed.data;

  const { data: count } = await supabaseAdmin.from("stock_counts").select("status, created_by").eq("id", id).maybeSingle();
  if (!count) return NextResponse.json({ error: "Count not found." }, { status: 404 });
  const manager = isStockManager(auth.session);

  if (action === "save" || action === "submit") {
    if (count.status !== "draft") return NextResponse.json({ error: "This count was already sent for approval." }, { status: 409 });
    if (lines && lines.length > 0) {
      const { error } = await supabaseAdmin.rpc("save_count_lines", { p_count: id, p_lines: lines });
      if (error) return NextResponse.json(dbError("Could not save count lines", error), { status: 500 });
    }
    if (action === "submit") {
      await supabaseAdmin
        .from("stock_counts")
        .update({ status: "submitted", submitted_by: auth.session.username, submitted_at: new Date().toISOString() })
        .eq("id", id);
    }
    return NextResponse.json({ ok: true });
  }

  if (!manager) return NextResponse.json({ error: "Only a head or the owner can do this." }, { status: 403 });

  if (action === "reopen") {
    if (count.status !== "submitted") return NextResponse.json({ error: "Only a count waiting for approval can be reopened." }, { status: 409 });
    await supabaseAdmin.from("stock_counts").update({ status: "draft" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  // approve
  if (auth.session.role !== "owner" && count.created_by === auth.session.username) {
    return NextResponse.json({ error: "Another head or the owner must approve a count you started." }, { status: 403 });
  }
  const { data, error } = await supabaseAdmin.rpc("approve_count", { p_count: id, p_by: auth.session.username });
  if (error) return NextResponse.json(dbError("Could not approve count", error), { status: 400 });
  return NextResponse.json({ adjusted: data });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/stock/counts/[id]">) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;
  const { id } = await ctx.params;
  const { data: count } = await supabaseAdmin.from("stock_counts").select("status").eq("id", id).maybeSingle();
  if (!count) return NextResponse.json({ error: "Count not found." }, { status: 404 });
  if (count.status === "approved") return NextResponse.json({ error: "An approved count cannot be deleted." }, { status: 409 });
  await supabaseAdmin.from("stock_counts").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
