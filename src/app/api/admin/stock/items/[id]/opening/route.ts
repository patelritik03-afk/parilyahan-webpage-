import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  qty: z.number().min(0).max(1_000_000),
  unit_cost: z.number().min(0).max(1_000_000),
});

// Opening stock can be set once, before any other entry exists for the item.
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/stock/items/[id]/opening">) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a quantity and cost of 0 or more." }, { status: 400 });
  }
  const { error } = await supabaseAdmin.rpc("post_opening_stock", {
    p_item: id,
    p_qty: parsed.data.qty,
    p_unit_cost: parsed.data.unit_cost,
    p_by: auth.session.username,
  });
  if (error) {
    const known = error.message?.includes("already has stock entries");
    if (!known) console.error("Could not set opening stock", error);
    return NextResponse.json(
      { error: known ? "This item already has stock entries. Use a stock check to correct it." : "Could not save." },
      { status: known ? 409 : 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
