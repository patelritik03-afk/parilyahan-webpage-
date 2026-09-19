import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { todayISO } from "@/lib/date";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const itemSchema = z.object({
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional().default(""),
});

const putSchema = z.object({
  date: dateSchema,
  items: z.array(itemSchema),
});

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const date = dateParam && dateSchema.safeParse(dateParam).success ? dateParam : todayISO();

  const { data, error } = await supabaseAdmin
    .from("daily_menu")
    .select("items")
    .eq("date", date)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load menu" }, { status: 500 });
  }

  return NextResponse.json({ date, items: data?.items ?? [] });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid menu data" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("daily_menu")
    .upsert(
      { date: parsed.data.date, items: parsed.data.items, updated_at: new Date().toISOString() },
      { onConflict: "date" }
    );

  if (error) {
    console.error("Failed to save menu", error);
    return NextResponse.json({ error: "Could not save menu" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
