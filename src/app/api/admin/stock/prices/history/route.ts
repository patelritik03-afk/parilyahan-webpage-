import { NextRequest, NextResponse } from "next/server";
import { requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { dbError } from "@/lib/stock/server";

// Every price paid for one item, newest first, with the supplier: heads and the owner only.
export async function GET(request: NextRequest) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;
  const item = request.nextUrl.searchParams.get("item");
  if (!item || !/^[0-9a-f-]{36}$/i.test(item)) return NextResponse.json({ error: "Choose an item." }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("purchase_bill_lines")
    .select("qty, unit, unit_price, base_qty, base_cost, change_pct, purchase_bills!inner(bill_date, bill_no, suppliers(name))")
    .eq("item_id", item)
    .order("bill_date", { referencedTable: "purchase_bills", ascending: false })
    .limit(200);
  if (error) return NextResponse.json(dbError("Could not load price history", error), { status: 500 });
  const rows = (data ?? [])
    .map((r) => {
      const bill = r.purchase_bills as unknown as { bill_date: string; bill_no: string | null; suppliers: { name: string } | null };
      return {
        date: bill.bill_date,
        bill_no: bill.bill_no,
        supplier: bill.suppliers?.name ?? null,
        qty: Number(r.qty),
        unit: r.unit,
        unit_price: Number(r.unit_price),
        base_cost: Number(r.base_cost),
        change_pct: r.change_pct === null ? null : Number(r.change_pct),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  return NextResponse.json({ history: rows });
}
