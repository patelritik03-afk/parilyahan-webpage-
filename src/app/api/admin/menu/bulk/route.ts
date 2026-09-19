import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";

const bulkSchema = z.object({
  menus: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        items: z.array(
          z.object({
            category: z.string().trim().min(1).max(100),
            name: z.string().trim().min(1).max(200),
            description: z.string().trim().max(500).optional().default(""),
          })
        ),
      })
    )
    .min(1)
    .max(400),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid menu data" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("daily_menu").upsert(
    parsed.data.menus.map((menu) => ({ ...menu, updated_at: now })),
    { onConflict: "date" }
  );

  if (error) {
    console.error("Bulk menu save failed", error);
    return NextResponse.json({ error: "Could not save menus" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: parsed.data.menus.length });
}
