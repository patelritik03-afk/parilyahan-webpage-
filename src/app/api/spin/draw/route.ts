import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { sendCouponMessage } from "@/lib/spin/server";
import { notifyOwner } from "@/lib/stock/server";

// The spin. The result is decided here (in the database), the wheel only shows it.
export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit("spin-draw", request, { limit: 20, windowSec: 10 * 60 });
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const { data: player } = await supabaseAdmin
    .from("spin_players")
    .select("id, full_name, source, verified_at, spin_customers(phone, wa_last_inbound_at)")
    .eq("token", token)
    .maybeSingle();
  if (!player) return NextResponse.json({ error: "bad-token" }, { status: 404 });
  if (!player.verified_at) return NextResponse.json({ error: "not-verified" }, { status: 403 });

  const { data, error } = await supabaseAdmin.rpc("spin_draw", { p_player: player.id });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("already spun")) return NextResponse.json({ error: "already" }, { status: 409 });
    if (msg.includes("not running")) return NextResponse.json({ error: "not-running" }, { status: 409 });
    console.error("Spin draw failed", error);
    return NextResponse.json({ error: "Please try again." }, { status: 500 });
  }
  const result = data as { coupon_id: string; code: string; prize_id: string; position: number; expires_on: string; is_jackpot: boolean };
  const { data: prize } = await supabaseAdmin
    .from("spin_prizes")
    .select("emoji, label_en, label_tl, short_en, short_tl, is_jackpot")
    .eq("id", result.prize_id)
    .single();
  const customer = player.spin_customers as unknown as { phone: string; wa_last_inbound_at: string | null };

  let whatsappSent = false;
  try {
    whatsappSent = Boolean(
      prize &&
        (await sendCouponMessage({
          phone: customer.phone,
          name: player.full_name,
          prize,
          code: result.code,
          expiresOn: result.expires_on,
          lastInbound: customer.wa_last_inbound_at,
        }))
    );
    if (whatsappSent) await supabaseAdmin.from("spin_coupons").update({ whatsapp_sent: true }).eq("id", result.coupon_id);
  } catch (err) {
    console.error("Could not send coupon on WhatsApp", err);
  }

  if (result.is_jackpot && prize) {
    await notifyOwner(`Spin & Win: ${player.full_name} won ${prize.short_en}`, `Big prize won on Spin & Win ${prize.emoji}`, [
      ["Winner", player.full_name],
      ["Mobile", customer.phone],
      ["Prize", prize.label_en],
      ["Code", result.code],
      ["From", player.source ?? "website"],
    ]);
  }

  return NextResponse.json({
    position: result.position,
    code: result.code,
    expiresOn: result.expires_on,
    jackpot: result.is_jackpot,
    whatsappSent,
    prize,
  });
}
