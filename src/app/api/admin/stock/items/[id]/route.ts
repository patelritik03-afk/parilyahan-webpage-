import { NextRequest, NextResponse } from "next/server";
import { requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { duplicateNameError, itemInputSchema } from "@/lib/stock/items";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/stock/items/[id]">) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;

  const { id } = await ctx.params;
  const parsed = itemInputSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the details." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("stock_items")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    const message = duplicateNameError(error, "An item");
    if (!message) console.error("Could not update stock item", error);
    return NextResponse.json({ error: message ?? "Could not save the item." }, { status: message ? 400 : 500 });
  }
  if (!data) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
