import { NextRequest, NextResponse } from "next/server";
import { requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { duplicateNameError, supplierInputSchema } from "@/lib/stock/items";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/stock/suppliers/[id]">) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;

  const { id } = await ctx.params;
  const parsed = supplierInputSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the details." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    const message = duplicateNameError(error, "A supplier");
    if (!message) console.error("Could not update supplier", error);
    return NextResponse.json({ error: message ?? "Could not save the supplier." }, { status: message ? 400 : 500 });
  }
  if (!data) return NextResponse.json({ error: "Supplier not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
