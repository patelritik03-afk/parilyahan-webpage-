export type AdminPrize = {
  id: string;
  campaign_id: string;
  position: number;
  emoji: string;
  label_en: string;
  label_tl: string;
  short_en: string;
  short_tl: string;
  color: string;
  chance: number;
  limit_count: number | null;
  limit_period: "day" | "week" | "campaign" | null;
  release_day: number;
  is_fallback: boolean;
  is_jackpot: boolean;
  terms: string | null;
};

export type AdminCampaign = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  active: boolean;
  coupon_days: number;
  terms: string | null;
  banner: boolean;
  verify_mode: "reverse" | "typed" | "both";
  spin_prizes: AdminPrize[];
};

export type SpinOverview = {
  manager: boolean;
  owner: boolean;
  whatsappReady: boolean;
  otpTemplateReady: boolean;
  unseen: number;
  campaigns: AdminCampaign[];
};

export const SOURCES = [
  { value: "table", label: "Tables (QR on each table)" },
  { value: "kiosk", label: "Restaurant screen" },
  { value: "poster", label: "Posters / standees" },
  { value: "website", label: "Website" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp status / groups" },
];

export const fmtDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })
    : "";

export const fmtDate = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
