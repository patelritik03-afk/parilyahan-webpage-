import "server-only";
import { z } from "zod";
import { supabaseAdmin } from "../supabase";
import { sendOwnerNotificationEmail } from "../email";
import { sendOwnerWhatsAppText } from "../whatsapp";
import { logFailures } from "../notify";
import { isoDateSchema } from "../validation";

const ALERT_KEY = "stock_price_alert_pct";
export const DEFAULT_ALERT_PCT = 5;

export async function getPriceAlertPct() {
  const { data } = await supabaseAdmin.from("admin_settings").select("value").eq("key", ALERT_KEY).maybeSingle();
  const value = Number(data?.value);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_ALERT_PCT;
}

export async function setPriceAlertPct(pct: number) {
  const { error } = await supabaseAdmin
    .from("admin_settings")
    .upsert({ key: ALERT_KEY, value: String(pct), updated_at: new Date().toISOString() });
  return !error;
}

// Email + WhatsApp to the owner. Never throws: a failed notification must not undo the entry.
export async function notifyOwner(subject: string, heading: string, rows: [string, string][]) {
  const results = await Promise.allSettled([
    sendOwnerNotificationEmail(subject, rows, heading),
    sendOwnerWhatsAppText([heading, ...rows.map(([label, value]) => `${label}: ${value}`)]),
  ]);
  logFailures("Stock notification", results);
}

export const dateParam = (value: string | null) => (value && isoDateSchema.safeParse(value).success ? value : null);

export const lineQty = z.number().positive().max(1_000_000);

export async function itemNames(ids: string[]) {
  if (ids.length === 0) return new Map<string, { name: string; base_unit: string }>();
  const { data } = await supabaseAdmin.from("stock_items").select("id, name, base_unit").in("id", [...new Set(ids)]);
  return new Map((data ?? []).map((r) => [r.id, { name: r.name, base_unit: r.base_unit }]));
}

export function dbError(label: string, error: unknown, message = "Something went wrong. Please try again.") {
  console.error(label, error);
  const text = (error as { message?: string })?.message ?? "";
  // Messages raised on purpose by the database functions are safe to show.
  const known = /needs at least one item|Unit .* is not used|Check quantities|Quantities must|Only a submitted count|already has stock entries/.exec(text);
  return { error: known ? text.replace(/^.*?: /, "") : message };
}

// Login names -> the names people are shown with ("owner" is the owner).
export async function displayNames(usernames: (string | null | undefined)[]) {
  const wanted = [...new Set(usernames.filter((u): u is string => Boolean(u) && u !== "owner"))];
  const map = new Map<string, string>([["owner", "Owner"]]);
  if (wanted.length) {
    const { data } = await supabaseAdmin.from("staff_users").select("username, display_name").in("username", wanted);
    for (const row of data ?? []) map.set(row.username, row.display_name);
  }
  return (username: string | null | undefined) => (username ? map.get(username) ?? username : null);
}
