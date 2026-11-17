import { NextRequest, NextResponse } from "next/server";
import { requireSpin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { todayISO } from "@/lib/date";

// Contest numbers for one campaign: players, verified, spins, wins per prize vs. chance, by source.
export async function GET(request: NextRequest) {
  const auth = await requireSpin("manager");
  if ("denied" in auth) return auth.denied;
  const campaignId = request.nextUrl.searchParams.get("campaign");
  if (!campaignId) return NextResponse.json({ error: "Choose a campaign." }, { status: 400 });

  const [{ data: campaign }, { data: prizes }, { data: players }, { data: coupons }] = await Promise.all([
    supabaseAdmin.from("spin_campaigns").select("starts_on").eq("id", campaignId).maybeSingle(),
    supabaseAdmin.from("spin_prizes").select("id, position, emoji, short_en, chance, limit_count, limit_period").eq("campaign_id", campaignId).order("position"),
    supabaseAdmin.from("spin_players").select("source, verified_at").eq("campaign_id", campaignId).range(0, 49999),
    supabaseAdmin.from("spin_coupons").select("prize_id, drawn_prize_id, won_on, redeemed_at").eq("campaign_id", campaignId).range(0, 49999),
  ]);
  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  const today = todayISO();
  const day = Math.floor((Date.parse(today) - Date.parse(campaign.starts_on)) / 86_400_000) + 1;
  const weekOf = (d: string) => Math.floor((Date.parse(d) - Date.parse(campaign.starts_on)) / 86_400_000 / 7);
  const thisWeek = weekOf(today);
  const all = coupons ?? [];

  const bySource = new Map<string, { players: number; verified: number; spins: number }>();
  for (const p of players ?? []) {
    const s = bySource.get(p.source ?? "website") ?? { players: 0, verified: 0, spins: 0 };
    s.players += 1;
    if (p.verified_at) s.verified += 1;
    bySource.set(p.source ?? "website", s);
  }

  return NextResponse.json({
    day,
    players: players?.length ?? 0,
    verified: (players ?? []).filter((p) => p.verified_at).length,
    spins: all.length,
    redeemed: all.filter((c) => c.redeemed_at).length,
    prizes: (prizes ?? []).map((p) => {
      const won = all.filter((c) => c.prize_id === p.id);
      return {
        ...p,
        won: won.length,
        drawn: all.filter((c) => c.drawn_prize_id === p.id).length,
        share: all.length ? Math.round((won.length / all.length) * 1000) / 10 : 0,
        today: won.filter((c) => c.won_on === today).length,
        thisWeek: won.filter((c) => weekOf(c.won_on) === thisWeek).length,
        redeemed: won.filter((c) => c.redeemed_at).length,
      };
    }),
    sources: [...bySource].map(([source, s]) => ({ source, ...s })).sort((a, b) => b.players - a.players),
  });
}
