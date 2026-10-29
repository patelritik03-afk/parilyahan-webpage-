import { NextRequest, NextResponse } from "next/server";
import { isStockManager, requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { duplicateNameError, itemInputSchema, listStockItems } from "@/lib/stock/items";
import { PAR_COVER_DAYS, PAR_HISTORY_DAYS, getParSuggestions } from "@/lib/stock/parSuggestions";

export async function GET() {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  try {
    const manager = isStockManager(auth.session);
    const items = await listStockItems(manager);
    if (!manager) return NextResponse.json({ items });

    const par = await getParSuggestions(new Map(items.map((i) => [i.id, i.base_unit])));
    for (const item of items) item.suggested_par = par.byItem.get(item.id) ?? null;
    return NextResponse.json({
      items,
      parInfo: { daysOfRecords: par.daysOfRecords, ready: par.ready, historyDays: PAR_HISTORY_DAYS, coverDays: PAR_COVER_DAYS },
    });
  } catch (err) {
    console.error("Could not list stock items", err);
    return NextResponse.json({ error: "Could not load the items." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;

  const parsed = itemInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the details." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("stock_items")
    .insert({ ...parsed.data, created_by: auth.session.username })
    .select("id")
    .single();
  if (error) {
    const message = duplicateNameError(error, "An item");
    if (!message) console.error("Could not add stock item", error);
    return NextResponse.json({ error: message ?? "Could not add the item." }, { status: message ? 400 : 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
