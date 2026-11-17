import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { MAX_ATTEMPTS } from "@/lib/spin/server";

// Typed-code mode: the customer types the 6-digit code they received on WhatsApp.
export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit("spin-verify", request, { limit: 30, windowSec: 10 * 60 });
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const code = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";
  const { data: player } = await supabaseAdmin
    .from("spin_players")
    .select("id, customer_id, verify_code, code_expires_at, attempts, verified_at, spin_campaigns(verify_mode)")
    .eq("token", token)
    .maybeSingle();
  if (!player) return NextResponse.json({ error: "bad-token" }, { status: 404 });
  if (player.verified_at) return NextResponse.json({ verified: true });
  if ((player.spin_campaigns as unknown as { verify_mode: string }).verify_mode === "reverse") {
    return NextResponse.json({ error: "Not available." }, { status: 400 });
  }
  if (player.attempts >= MAX_ATTEMPTS) return NextResponse.json({ error: "too-many" }, { status: 429 });
  if (!player.code_expires_at || Date.parse(player.code_expires_at) < Date.now()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }
  const ok =
    code.length === 6 &&
    player.verify_code?.length === 6 &&
    timingSafeEqual(Buffer.from(code), Buffer.from(player.verify_code));
  if (!ok) {
    await supabaseAdmin.from("spin_players").update({ attempts: player.attempts + 1 }).eq("id", player.id);
    return NextResponse.json({ error: "wrong-code", left: MAX_ATTEMPTS - player.attempts - 1 }, { status: 400 });
  }
  const now = new Date().toISOString();
  await supabaseAdmin.from("spin_players").update({ verified_at: now, verify_code: null }).eq("id", player.id);
  await supabaseAdmin.from("spin_customers").update({ verified_at: now }).eq("id", player.customer_id);
  return NextResponse.json({ verified: true });
}
