import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isStockManager, requireSpin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isoDateSchema } from "@/lib/validation";
import { whatsappCloudReady } from "@/lib/whatsappCloud";

const campaignSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  starts_on: isoDateSchema,
  ends_on: isoDateSchema,
  active: z.boolean(),
  coupon_days: z.number().int().min(1).max(365),
  terms: z.string().trim().max(2000).nullable(),
  banner: z.boolean(),
  verify_mode: z.enum(["reverse", "typed", "both"]),
});

// The campaigns (newest first) with their prizes. Chances are only for heads and the owner.
export async function GET(request: NextRequest) {
  const auth = await requireSpin();
  if ("denied" in auth) return auth.denied;
  // The nav badge only needs the number of new wins.
  if (request.nextUrl.searchParams.get("count") === "1") {
    const { count } = await supabaseAdmin.from("spin_coupons").select("id", { count: "exact", head: true }).is("seen_at", null);
    return NextResponse.json({ unseen: count ?? 0 });
  }
  const manager = isStockManager(auth.session);
  const { data: campaigns, error } = await supabaseAdmin
    .from("spin_campaigns")
    .select("*, spin_prizes(*)")
    .order("starts_on", { ascending: false });
  if (error) {
    console.error("Could not load spin campaigns", error);
    return NextResponse.json({ error: "Could not load." }, { status: 500 });
  }
  const { count: unseen } = await supabaseAdmin.from("spin_coupons").select("id", { count: "exact", head: true }).is("seen_at", null);
  return NextResponse.json({
    manager,
    owner: auth.session.role === "owner",
    whatsappReady: whatsappCloudReady(),
    otpTemplateReady: Boolean(process.env.WHATSAPP_OTP_TEMPLATE),
    unseen: unseen ?? 0,
    campaigns: manager
      ? (campaigns ?? []).map((c) => ({ ...c, spin_prizes: [...(c.spin_prizes ?? [])].sort((a, b) => a.position - b.position) }))
      : [],
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireSpin("manager");
  if ("denied" in auth) return auth.denied;
  const parsed = campaignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the details." }, { status: 400 });
  const { id, ...fields } = parsed.data;
  if (fields.ends_on < fields.starts_on) return NextResponse.json({ error: "The end date must be after the start date." }, { status: 400 });

  const { data: current } = await supabaseAdmin.from("spin_campaigns").select("verify_mode").eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  // Only the owner changes how numbers are verified (the typed mode costs money per code).
  if (fields.verify_mode !== current.verify_mode && auth.session.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can change the verification setting." }, { status: 403 });
  }
  if (fields.active) {
    const { data: prizes } = await supabaseAdmin.from("spin_prizes").select("chance, is_fallback").eq("campaign_id", id);
    const total = (prizes ?? []).reduce((s, p) => s + Number(p.chance), 0);
    if (Math.abs(total - 100) > 0.001) return NextResponse.json({ error: `Chances add up to ${total}%. They must total 100% before switching on.` }, { status: 400 });
    if (!(prizes ?? []).some((p) => p.is_fallback)) return NextResponse.json({ error: "Choose an 'instead' prize first." }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("spin_campaigns").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) {
    console.error("Could not save spin campaign", error);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
