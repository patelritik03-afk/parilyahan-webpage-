import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

const patchSchema = z.object({ visible: z.boolean() });

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/reviews/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("reviews").update({ visible: parsed.data.visible }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not update the review." }, { status: 500 });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/reviews/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not delete the review." }, { status: 500 });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
