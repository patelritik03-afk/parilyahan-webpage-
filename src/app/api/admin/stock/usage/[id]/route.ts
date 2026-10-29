import { NextRequest, NextResponse } from "next/server";
import { isStockManager, requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { todayISO } from "@/lib/date";
import { dbError } from "@/lib/stock/server";

// Staff can remove their own entries on the same day; heads and the owner any entry.
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/stock/usage/[id]">) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const { id } = await ctx.params;
  const { data: entry } = await supabaseAdmin
    .from("stock_movements")
    .select("id, item_id, created_by, entry_date, ref_type")
    .eq("id", id)
    .maybeSingle();
  if (!entry || entry.ref_type !== "usage") return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  const own = entry.created_by === auth.session.username && entry.entry_date === todayISO();
  if (!isStockManager(auth.session) && !own) {
    return NextResponse.json({ error: "Only a head can remove this entry." }, { status: 403 });
  }
  const { error } = await supabaseAdmin.from("stock_movements").delete().eq("id", id);
  if (error) return NextResponse.json(dbError("Could not delete usage", error), { status: 500 });
  await supabaseAdmin.rpc("recompute_item_cost", { p_item: entry.item_id });
  return NextResponse.json({ ok: true });
}
