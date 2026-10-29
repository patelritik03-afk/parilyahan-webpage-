import { NextRequest, NextResponse } from "next/server";
import { isStockManager, requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { dbError, displayNames } from "@/lib/stock/server";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/stock/bills/[id]">) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const { id } = await ctx.params;
  const { data: bill, error } = await supabaseAdmin
    .from("purchase_bills")
    .select("*, suppliers(name, phone), purchase_bill_lines(*, stock_items(name, base_unit))")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json(dbError("Could not load bill", error), { status: 500 });
  if (!bill) return NextResponse.json({ error: "Bill not found." }, { status: 404 });

  let photoUrl: string | null = null;
  if (bill.photo_path) {
    const { data } = await supabaseAdmin.storage.from("stock-bills").createSignedUrl(bill.photo_path, 60 * 30);
    photoUrl = data?.signedUrl ?? null;
  }
  const name = await displayNames([bill.created_by]);
  return NextResponse.json({ bill: { ...bill, created_by: name(bill.created_by) }, photoUrl, canDelete: isStockManager(auth.session) });
}

// Removing a bill takes its stock back out and recalculates the items' costs.
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/stock/bills/[id]">) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;
  const { id } = await ctx.params;
  const { data: bill } = await supabaseAdmin.from("purchase_bills").select("photo_path").eq("id", id).maybeSingle();
  if (!bill) return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  const { error } = await supabaseAdmin.rpc("delete_bill", { p_bill: id });
  if (error) return NextResponse.json(dbError("Could not delete bill", error), { status: 500 });
  if (bill.photo_path) await supabaseAdmin.storage.from("stock-bills").remove([bill.photo_path]);
  return NextResponse.json({ ok: true });
}
