import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { isHoneypotFilled } from "@/lib/validation";
import { cleanSource } from "@/lib/spin/text";
import {
  CODE_MINUTES,
  compactPhone,
  getCurrentCampaign,
  isRunning,
  newCode,
  newToken,
  sendOtp,
  verifyMessage,
  waLink,
} from "@/lib/spin/server";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  phone: z.string().trim().regex(/^\+\d{1,4} \d{5,14}$/, "Enter a valid mobile number."),
  terms: z.literal(true, { message: "Please accept the contest terms." }),
  offers: z.boolean().optional().default(false),
  source: z.string().optional(),
  kiosk: z.boolean().optional().default(false),
});

// Step 1-2: name + number. Starts (or restarts) verification for this campaign.
export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit("spin-start", request, { limit: 20, windowSec: 10 * 60 });
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  if (isHoneypotFilled(body)) return NextResponse.json({ error: "Please try again." }, { status: 400 });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  }
  const { name, offers, kiosk } = parsed.data;
  const phone = compactPhone(parsed.data.phone);
  const source = cleanSource(parsed.data.source);

  const current = await getCurrentCampaign();
  if (!current || !isRunning(current.campaign)) return NextResponse.json({ error: "not-running" }, { status: 409 });
  const { campaign } = current;
  const now = new Date().toISOString();

  // The customer list: one row per number, latest name kept.
  const { data: existing } = await supabaseAdmin.from("spin_customers").select("id, consent_at").eq("phone", phone).maybeSingle();
  let customerId = existing?.id as string | undefined;
  if (customerId) {
    await supabaseAdmin
      .from("spin_customers")
      .update({ full_name: name, last_seen: now, ...(offers && !existing?.consent_at ? { consent_at: now } : {}) })
      .eq("id", customerId);
  } else {
    const { data, error } = await supabaseAdmin
      .from("spin_customers")
      .insert({ phone, full_name: name, consent_at: offers ? now : null })
      .select("id")
      .single();
    if (error) {
      console.error("Could not save spin customer", error);
      return NextResponse.json({ error: "Please try again." }, { status: 500 });
    }
    customerId = data.id;
  }

  const { data: player } = await supabaseAdmin
    .from("spin_players")
    .select("id, spin_coupons(won_at)")
    .eq("campaign_id", campaign.id)
    .eq("customer_id", customerId)
    .maybeSingle();
  // One coupon per player, so this comes back as a single row (or a list, depending on the relation).
  const won = player?.spin_coupons as unknown as { won_at: string } | { won_at: string }[] | null;
  const coupon = Array.isArray(won) ? won[0] : won;
  // Already played: never show the code here (anyone can type a number); it went to their WhatsApp.
  if (coupon) return NextResponse.json({ already: true, wonAt: coupon.won_at });

  const code = newCode();
  const token = newToken();
  const fields = {
    full_name: name,
    source,
    kiosk,
    token,
    verify_code: code,
    code_expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
    attempts: 0,
    // Every new start needs a fresh verification, so nobody can spin for someone else.
    verified_at: null,
  };
  const { error } = player
    ? await supabaseAdmin.from("spin_players").update(fields).eq("id", player.id)
    : await supabaseAdmin.from("spin_players").insert({ ...fields, campaign_id: campaign.id, customer_id: customerId });
  if (error) {
    console.error("Could not start spin", error);
    return NextResponse.json({ error: "Please try again." }, { status: 500 });
  }

  const reverse = campaign.verify_mode !== "typed";
  if (campaign.verify_mode === "typed") {
    try {
      await sendOtp(phone, code);
    } catch (err) {
      console.error("Could not send spin code", err);
      return NextResponse.json({ error: "Could not send the code to WhatsApp. Please try again." }, { status: 502 });
    }
  }
  return NextResponse.json({
    token,
    mode: campaign.verify_mode,
    expiresInMin: CODE_MINUTES,
    // For "verify on WhatsApp" the customer sends this code to us; showing it is safe because
    // the proof is that the message comes from their own WhatsApp number.
    ...(reverse ? { message: verifyMessage(code), waLink: waLink(code) } : {}),
  });
}
