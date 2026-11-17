import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { CODE_MINUTES, newCode, sendOtp } from "@/lib/spin/server";

// "Send me a code instead": a 6-digit code to the customer's WhatsApp (paid template message).
export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit("spin-send-code", request, { limit: 5, windowSec: 10 * 60 });
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const { data: player } = await supabaseAdmin
    .from("spin_players")
    .select("id, verified_at, spin_customers(phone), spin_campaigns(verify_mode)")
    .eq("token", token)
    .maybeSingle();
  if (!player) return NextResponse.json({ error: "bad-token" }, { status: 404 });
  const mode = (player.spin_campaigns as unknown as { verify_mode: string }).verify_mode;
  if (mode === "reverse") return NextResponse.json({ error: "Not available." }, { status: 400 });
  if (player.verified_at) return NextResponse.json({ ok: true });

  const code = newCode();
  await supabaseAdmin
    .from("spin_players")
    .update({ verify_code: code, code_expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(), attempts: 0 })
    .eq("id", player.id);
  try {
    const sent = await sendOtp((player.spin_customers as unknown as { phone: string }).phone, code);
    if (!sent) return NextResponse.json({ error: "Code sending is not set up yet." }, { status: 503 });
  } catch (err) {
    console.error("Could not send spin code", err);
    return NextResponse.json({ error: "Could not send the code. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
