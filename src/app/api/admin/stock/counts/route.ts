import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStock } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { todayISO } from "@/lib/date";
import { isoDateSchema } from "@/lib/validation";
import { dbError, displayNames } from "@/lib/stock/server";

const createSchema = z.object({
  date: isoDateSchema.optional(),
  scope: z.string().trim().max(60).optional().default("All"),
});

export async function GET() {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const { data, error } = await supabaseAdmin
    .from("stock_counts")
    .select("id, count_date, scope, status, created_by, submitted_by, approved_by, approved_at, created_at, stock_count_lines(count)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json(dbError("Could not list counts", error), { status: 500 });
  const name = await displayNames((data ?? []).flatMap((c) => [c.created_by, c.submitted_by, c.approved_by]));
  return NextResponse.json({
    counts: (data ?? []).map((c) => ({
      ...c,
      created_by: name(c.created_by),
      submitted_by: name(c.submitted_by),
      approved_by: name(c.approved_by),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Please check the details." }, { status: 400 });
  const date = parsed.data.date ?? todayISO();
  if (date > todayISO()) return NextResponse.json({ error: "The date cannot be in the future." }, { status: 400 });
  const { data, error } = await supabaseAdmin.rpc("create_count", {
    p_date: date,
    p_scope: parsed.data.scope,
    p_by: auth.session.username,
  });
  if (error) return NextResponse.json(dbError("Could not start count", error), { status: 500 });
  return NextResponse.json({ id: data }, { status: 201 });
}
