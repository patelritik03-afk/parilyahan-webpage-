import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSpin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { couponStatus } from "@/lib/spin/server";
import { formatCouponCode } from "@/lib/spin/text";
import { displayNames } from "@/lib/stock/server";

const SELECT =
  "id, code, won_at, won_on, expires_on, redeemed_at, redeemed_by, whatsapp_sent, seen_at, reservation_id, " +
  "spin_customers(full_name, phone), spin_players(source, kiosk), spin_prizes!spin_coupons_prize_id_fkey(emoji, short_en, label_en, is_jackpot)";

// The coupon section: every win with the customer's name. Staff with the area can search and redeem.
export async function GET(request: NextRequest) {
  const auth = await requireSpin();
  if ("denied" in auth) return auth.denied;
  const p = request.nextUrl.searchParams;
  const q = (p.get("q") ?? "").trim();
  let query = supabaseAdmin.from("spin_coupons").select(SELECT).order("won_at", { ascending: false }).limit(300);

  if (q) {
    const code = formatCouponCode(q);
    if (code) query = query.eq("code", code);
    else {
      // Search by name or number.
      const digits = q.replace(/\D/g, "");
      const { data: customers } = await supabaseAdmin
        .from("spin_customers")
        .select("id")
        .or(digits.length >= 4 ? `phone.ilike.%${digits}%` : `full_name.ilike.%${q.replace(/[%,()]/g, "")}%`)
        .limit(50);
      query = query.in("customer_id", (customers ?? []).map((c) => c.id).concat("00000000-0000-0000-0000-000000000000"));
    }
  }
  const { data, error } = await query;
  if (error) {
    console.error("Could not load coupons", error);
    return NextResponse.json({ error: "Could not load." }, { status: 500 });
  }
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const name = await displayNames(rows.map((r) => r.redeemed_by as string | null));
  const status = p.get("status");
  const coupons = rows
    .map((r) => ({ ...r, status: couponStatus(r as { redeemed_at: string | null; expires_on: string }), redeemed_by: name(r.redeemed_by as string | null) }))
    .filter((r) => !status || r.status === status);
  return NextResponse.json({ coupons });
}

const patchSchema = z.object({
  action: z.enum(["redeem", "undo", "seen"]),
  id: z.uuid().optional(),
});

export async function PATCH(request: NextRequest) {
  const auth = await requireSpin();
  if ("denied" in auth) return auth.denied;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the request." }, { status: 400 });
  const { action, id } = parsed.data;
  const now = new Date().toISOString();

  if (action === "seen") {
    await supabaseAdmin.from("spin_coupons").update({ seen_at: now }).is("seen_at", null);
    return NextResponse.json({ ok: true });
  }
  if (!id) return NextResponse.json({ error: "Missing coupon." }, { status: 400 });
  const { data: coupon } = await supabaseAdmin.from("spin_coupons").select("expires_on, redeemed_at").eq("id", id).maybeSingle();
  if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

  if (action === "redeem") {
    const status = couponStatus(coupon);
    if (status !== "active") return NextResponse.json({ error: status === "redeemed" ? "Already used." : "This coupon has expired." }, { status: 409 });
    // Only marks it if it is still unused (two staff pressing at once can't both redeem).
    const { data } = await supabaseAdmin
      .from("spin_coupons")
      .update({ redeemed_at: now, redeemed_by: auth.session.username, seen_at: now })
      .eq("id", id)
      .is("redeemed_at", null)
      .select("id");
    if (!data?.length) return NextResponse.json({ error: "Already used." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  // undo: heads and the owner can reverse a mistaken redemption.
  if (auth.session.level === "staff") return NextResponse.json({ error: "Ask a head to undo this." }, { status: 403 });
  await supabaseAdmin.from("spin_coupons").update({ redeemed_at: null, redeemed_by: null }).eq("id", id);
  return NextResponse.json({ ok: true });
}
