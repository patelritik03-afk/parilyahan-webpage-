import { NextRequest, NextResponse } from "next/server";
import { isStockManager, requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { duplicateNameError, itemInputSchema, listStockItems } from "@/lib/stock/items";

export async function GET() {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  try {
    return NextResponse.json({ items: await listStockItems(isStockManager(auth.session)) });
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
