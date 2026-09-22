import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

const offerSchema = z.object({
  title: z.string().trim().min(1).max(100),
  price: z.number().min(0).max(100000),
  note: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().max(500).optional().default(""),
  active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
});

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("offers")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Could not load offers" }, { status: 500 });
  return NextResponse.json({ offers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = offerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a title and a valid price." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("offers").insert(parsed.data);
  if (error) {
    return NextResponse.json(
      { error: "Could not save. The offers table may be missing in Supabase." },
      { status: 500 }
    );
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true }, { status: 201 });
}
