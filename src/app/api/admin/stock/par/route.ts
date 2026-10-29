import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getParSuggestions } from "@/lib/stock/parSuggestions";

const schema = z.object({ itemIds: z.array(z.uuid()).max(2000).optional() });

// Sets par levels to the suggested values: for the listed items, or for every item with a suggestion.
export async function POST(request: NextRequest) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Please check the request." }, { status: 400 });

  const { data: items, error } = await supabaseAdmin.from("stock_items").select("id, base_unit").range(0, 4999);
  if (error) {
    console.error("Could not read items for par levels", error);
    return NextResponse.json({ error: "Could not load the items." }, { status: 500 });
  }
  const par = await getParSuggestions(new Map((items ?? []).map((i) => [i.id, i.base_unit])));
  if (!par.ready) {
    return NextResponse.json({ error: "Suggestions need a month of daily usage records first." }, { status: 409 });
  }

  const wanted = parsed.data.itemIds ? new Set(parsed.data.itemIds) : null;
  const updates = [...par.byItem].filter(([id]) => !wanted || wanted.has(id));
  const now = new Date().toISOString();
  for (const [id, level] of updates) {
    const { error: updateError } = await supabaseAdmin
      .from("stock_items")
      .update({ par_level: level, updated_at: now })
      .eq("id", id);
    if (updateError) {
      console.error("Could not set par level", updateError);
      return NextResponse.json({ error: "Could not save every par level. Please try again." }, { status: 500 });
    }
  }
  return NextResponse.json({ updated: updates.length });
}
