import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSpin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const prizeSchema = z.object({
  id: z.uuid(),
  emoji: z.string().trim().max(8),
  label_en: z.string().trim().min(1).max(120),
  label_tl: z.string().trim().min(1).max(120),
  short_en: z.string().trim().min(1).max(18),
  short_tl: z.string().trim().min(1).max(18),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  chance: z.number().min(0).max(100),
  limit_count: z.number().int().min(0).max(100000).nullable(),
  limit_period: z.enum(["day", "week", "campaign"]).nullable(),
  release_day: z.number().int().min(1).max(366),
  is_fallback: z.boolean(),
  is_jackpot: z.boolean(),
  terms: z.string().trim().max(500).nullable(),
});

const schema = z.object({ campaign_id: z.uuid(), prizes: z.array(prizeSchema).min(2).max(12) });

// Saves all slices of a wheel at once: chances must total 100% and exactly one "instead" prize.
export async function PUT(request: NextRequest) {
  const auth = await requireSpin("manager");
  if ("denied" in auth) return auth.denied;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the prizes." }, { status: 400 });
  const { campaign_id, prizes } = parsed.data;

  const total = Math.round(prizes.reduce((s, p) => s + p.chance, 0) * 1000) / 1000;
  if (total !== 100) return NextResponse.json({ error: `Chances add up to ${total}%. They must total exactly 100%.` }, { status: 400 });
  const fallbacks = prizes.filter((p) => p.is_fallback);
  if (fallbacks.length !== 1) return NextResponse.json({ error: "Choose exactly one 'instead' prize." }, { status: 400 });
  if (fallbacks[0].limit_count !== null || fallbacks[0].release_day > 1) {
    return NextResponse.json({ error: "The 'instead' prize can't have a limit or a release day." }, { status: 400 });
  }
  if (prizes.some((p) => (p.limit_count === null) !== (p.limit_period === null))) {
    return NextResponse.json({ error: "Each limit needs both a number and a period." }, { status: 400 });
  }

  for (const { id, ...fields } of prizes) {
    const { error } = await supabaseAdmin.from("spin_prizes").update(fields).eq("id", id).eq("campaign_id", campaign_id);
    if (error) {
      console.error("Could not save spin prize", error);
      return NextResponse.json({ error: "Could not save the prizes." }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
