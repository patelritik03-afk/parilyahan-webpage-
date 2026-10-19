import { NextRequest, NextResponse } from "next/server";
import { requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { duplicateNameError, listSuppliers, supplierInputSchema } from "@/lib/stock/items";

export async function GET() {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  try {
    return NextResponse.json({ suppliers: await listSuppliers() });
  } catch (err) {
    console.error("Could not list suppliers", err);
    return NextResponse.json({ error: "Could not load the suppliers." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;

  const parsed = supplierInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the details." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .insert({ ...parsed.data, created_by: auth.session.username })
    .select("id")
    .single();
  if (error) {
    const message = duplicateNameError(error, "A supplier");
    if (!message) console.error("Could not add supplier", error);
    return NextResponse.json({ error: message ?? "Could not add the supplier." }, { status: message ? 400 : 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
