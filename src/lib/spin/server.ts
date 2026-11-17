import "server-only";
import { randomBytes, randomInt } from "crypto";
import { supabaseAdmin } from "../supabase";
import { todayISO } from "../date";
import { WHATSAPP_NUMBER } from "../site";
import { sendWhatsAppOtp, sendWhatsAppText } from "../whatsappCloud";
import type { PublicCampaign, PublicPrize } from "./text";

export const CODE_MINUTES = 10;
export const MAX_ATTEMPTS = 5;

export type CampaignRow = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  active: boolean;
  coupon_days: number;
  terms: string | null;
  banner: boolean;
  verify_mode: "reverse" | "typed" | "both";
};

export type PrizeRow = PublicPrize & {
  id: string;
  chance: number;
  limit_count: number | null;
  limit_period: "day" | "week" | "campaign" | null;
  release_day: number;
  is_fallback: boolean;
  terms: string | null;
};

// The number customers message to verify: the WhatsApp Cloud API number once set up.
export function spinWhatsAppNumber() {
  return (process.env.WHATSAPP_SPIN_NUMBER || WHATSAPP_NUMBER).replace(/\D/g, "");
}

export function isRunning(c: Pick<CampaignRow, "active" | "starts_on" | "ends_on">) {
  const today = todayISO();
  return c.active && today >= c.starts_on && today <= c.ends_on;
}

// The campaign shown to the public: the active one (running or about to start).
export async function getCurrentCampaign(): Promise<{ campaign: CampaignRow; prizes: PrizeRow[] } | null> {
  const { data: campaigns } = await supabaseAdmin
    .from("spin_campaigns")
    .select("*")
    .eq("active", true)
    .gte("ends_on", todayISO())
    .order("starts_on", { ascending: true })
    .limit(1);
  const campaign = campaigns?.[0] as CampaignRow | undefined;
  if (!campaign) return null;
  const { data: prizes } = await supabaseAdmin.from("spin_prizes").select("*").eq("campaign_id", campaign.id).order("position");
  return { campaign, prizes: (prizes ?? []) as PrizeRow[] };
}

export function toPublic(campaign: CampaignRow, prizes: PrizeRow[]): PublicCampaign {
  return {
    running: isRunning(campaign),
    name: campaign.name,
    starts_on: campaign.starts_on,
    ends_on: campaign.ends_on,
    banner: campaign.banner,
    verify_mode: campaign.verify_mode,
    coupon_days: campaign.coupon_days,
    terms: campaign.terms,
    // Chances and limits stay on the server.
    prizes: prizes.map((p) => ({
      position: p.position,
      emoji: p.emoji,
      label_en: p.label_en,
      label_tl: p.label_tl,
      short_en: p.short_en,
      short_tl: p.short_tl,
      color: p.color,
      is_jackpot: p.is_jackpot,
    })),
  };
}

export const newToken = () => randomBytes(24).toString("base64url");
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

// "+971 501234567" -> "+971501234567"; digits only for WhatsApp.
export const compactPhone = (full: string) => `+${full.replace(/\D/g, "")}`;
export const phoneDigits = (full: string) => full.replace(/\D/g, "");

export function verifyMessage(code: string) {
  return `PSK ${code}`;
}

export function waLink(code: string) {
  return `https://wa.me/${spinWhatsAppNumber()}?text=${encodeURIComponent(
    `${verifyMessage(code)} - Spin & Win verification`
  )}`;
}

export function sendOtp(phone: string, code: string) {
  return sendWhatsAppOtp(phoneDigits(phone), code);
}

// The coupon on WhatsApp: free when the customer messaged us in the last 24 h (they did, to verify).
export async function sendCouponMessage(opts: {
  phone: string;
  name: string;
  prize: Pick<PrizeRow, "emoji" | "label_en" | "label_tl" | "is_jackpot">;
  code: string;
  expiresOn: string;
  lastInbound: string | null;
}) {
  const within24h = opts.lastInbound && Date.now() - Date.parse(opts.lastInbound) < 23.5 * 3600 * 1000;
  if (!within24h) return false;
  const first = opts.name.split(" ")[0];
  const lines = [
    opts.prize.is_jackpot ? "🎰 JACKPOT! 🎰" : "🎉 Congratulations! 🎉",
    `${first}, you won: ${opts.prize.emoji} ${opts.prize.label_en}`,
    `(${opts.prize.label_tl})`,
    "",
    `Your coupon code: *${opts.code}*`,
    `Valid until: ${opts.expiresOn}`,
    "",
    "📸 *To redeem:* post a story on Instagram, TikTok or Facebook and show it at the counter with this code.",
    "(Para ma-redeem: mag-post ng story sa Instagram, TikTok o Facebook at ipakita ito sa counter.)",
    "",
    "Show this code at Parilyahan Sa Kalye, Ibis Styles Hotel, Al Mina Road, Jumeirah 1. One coupon per visit, dine-in only.",
    "Book your table: https://www.parilyahansakalye.ae/reservation",
  ];
  return sendWhatsAppText(phoneDigits(opts.phone), lines.join("\n"));
}

export type CouponStatus = "active" | "redeemed" | "expired";
export function couponStatus(c: { redeemed_at: string | null; expires_on: string }): CouponStatus {
  if (c.redeemed_at) return "redeemed";
  return c.expires_on < todayISO() ? "expired" : "active";
}
