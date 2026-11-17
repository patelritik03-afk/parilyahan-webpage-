import "server-only";
import { supabaseAdmin } from "../supabase";
import { couponStatus } from "./server";

export type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
  consent: boolean;
  consent_at: string | null;
  verified: boolean;
  first_seen: string;
  last_seen: string;
  sources: string[];
  plays: number;
  prizes: string[];
  redeemed: number;
  active: number;
};

// The customer database: every number that took part, with what they won.
export async function listSpinCustomers(filters: { q?: string; consent?: boolean; verifiedOnly?: boolean }) {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabaseAdmin
      .from("spin_customers")
      .select(
        "id, full_name, phone, consent_at, verified_at, first_seen, last_seen, spin_players(source), spin_coupons(expires_on, redeemed_at, spin_prizes!spin_coupons_prize_id_fkey(short_en))"
      )
      .order("last_seen", { ascending: false })
      .range(from, from + 999);
    if (filters.verifiedOnly) query = query.not("verified_at", "is", null);
    if (filters.consent) query = query.not("consent_at", "is", null);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < 1000) break;
  }
  const q = filters.q?.trim().toLowerCase() ?? "";
  const digits = q.replace(/\D/g, "");
  return rows
    .map((r): CustomerRow => {
      const coupons = (r.spin_coupons as { expires_on: string; redeemed_at: string | null; spin_prizes: { short_en: string } | null }[]) ?? [];
      const players = (r.spin_players as { source: string | null }[]) ?? [];
      return {
        id: String(r.id),
        full_name: String(r.full_name),
        phone: String(r.phone),
        consent: Boolean(r.consent_at),
        consent_at: (r.consent_at as string) ?? null,
        verified: Boolean(r.verified_at),
        first_seen: String(r.first_seen),
        last_seen: String(r.last_seen),
        sources: [...new Set(players.map((p) => p.source ?? "website"))],
        plays: players.length,
        prizes: coupons.map((c) => c.spin_prizes?.short_en ?? "?"),
        redeemed: coupons.filter((c) => couponStatus(c) === "redeemed").length,
        active: coupons.filter((c) => couponStatus(c) === "active").length,
      };
    })
    .filter((c) => !q || c.full_name.toLowerCase().includes(q) || (digits.length >= 3 && c.phone.includes(digits)));
}
