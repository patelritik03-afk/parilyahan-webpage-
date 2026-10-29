import "server-only";
import { supabaseAdmin } from "../supabase";
import { addDaysISO, todayISO } from "../date";

// Par levels are not typed in up front: after a month of daily usage records the system suggests them
// from what was actually used, and a head or the owner approves them.
export const PAR_HISTORY_DAYS = 30;
// The suggested par covers this many days of average use (consumption + wastage).
export const PAR_COVER_DAYS = 7;

export type ParSuggestions = {
  daysOfRecords: number;
  ready: boolean;
  // item id -> suggested par level in the item's base unit
  byItem: Map<string, number>;
};

const DECIMAL_UNITS = new Set(["kg", "L", "gal"]);

function roundUp(value: number, unit: string) {
  return DECIMAL_UNITS.has(unit) ? Math.ceil(value * 10) / 10 : Math.ceil(value);
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export async function getParSuggestions(units: Map<string, string>): Promise<ParSuggestions> {
  const today = todayISO();
  const { data: first, error: firstError } = await supabaseAdmin
    .from("stock_movements")
    .select("entry_date")
    .eq("type", "consumption")
    .order("entry_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstError) throw firstError;

  const daysOfRecords = first ? daysBetween(first.entry_date, today) + 1 : 0;
  const byItem = new Map<string, number>();
  if (daysOfRecords < PAR_HISTORY_DAYS) return { daysOfRecords, ready: false, byItem };

  // The last full 30 days, not counting today (today's usage may not be entered yet).
  const from = addDaysISO(today, -PAR_HISTORY_DAYS);
  const used = new Map<string, number>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabaseAdmin
      .from("stock_movements")
      .select("item_id, qty")
      .in("type", ["consumption", "wastage"])
      .gte("entry_date", from)
      .lt("entry_date", today)
      .range(offset, offset + 999);
    if (error) throw error;
    for (const row of data ?? []) used.set(row.item_id, (used.get(row.item_id) ?? 0) - Number(row.qty));
    if (!data || data.length < 1000) break;
  }

  for (const [itemId, total] of used) {
    if (total <= 0) continue;
    const perDay = total / PAR_HISTORY_DAYS;
    byItem.set(itemId, roundUp(perDay * PAR_COVER_DAYS, units.get(itemId) ?? "pcs"));
  }
  return { daysOfRecords, ready: true, byItem };
}
