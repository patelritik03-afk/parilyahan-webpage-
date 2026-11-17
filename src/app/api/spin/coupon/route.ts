import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { couponStatus } from "@/lib/spin/server";
import { formatCouponCode } from "@/lib/spin/text";

// Reservation form: is this Spin & Win code real and still usable? (No personal details returned.)
export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit("spin-coupon", request, { limit: 30, windowSec: 10 * 60 });
  if (limited) return limited;
  const code = formatCouponCode(request.nextUrl.searchParams.get("code") ?? "");
  if (!code) return NextResponse.json({ valid: false });
  const { data } = await supabaseAdmin
    .from("spin_coupons")
    .select("code, expires_on, redeemed_at, spin_prizes!spin_coupons_prize_id_fkey(emoji, short_en, short_tl)")
    .eq("code", code)
    .maybeSingle();
  if (!data) return NextResponse.json({ valid: false });
  const status = couponStatus(data);
  return NextResponse.json({ valid: status === "active", status, code: data.code, expiresOn: data.expires_on, prize: data.spin_prizes });
}
