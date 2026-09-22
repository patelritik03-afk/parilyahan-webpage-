import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  price: z.number().min(0).max(100000).optional(),
  note: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/offers/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("offers").update(parsed.data).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not save the changes." }, { status: 500 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/offers/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const { error } = await supabaseAdmin.from("offers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not delete the offer." }, { status: 500 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
