import "server-only";
import { supabaseAdmin } from "../supabase";
import { addDaysISO, todayISO } from "../date";

export type ItemRow = { item_id: string; name: string; unit: string; qty: number; value: number };

export type StockReport = {
  from: string;
  to: string;
  totals: { purchases: number; consumption: number; wastage: number; foodCost: number; stockValue: number; bills: number };
  daily: { date: string; consumption: number; wastage: number; purchases: number }[];
  topBought: ItemRow[];
  mostConsumed: ItemRow[];
  mostWasted: ItemRow[];
  mostExpensive: { item_id: string; name: string; unit: string; avg_cost: number; last_price: number | null }[];
  slowMovers: { item_id: string; name: string; unit: string; qty: number; value: number; lastUsed: string | null; daysOfStock: number | null }[];
  wastageByReason: { reason: string; value: number; entries: number }[];
  suppliers: { name: string; total: number; bills: number }[];
  openOrders: number;
  unseenAlerts: number;
};

async function readAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

const top = <T extends { value: number }>(rows: T[], n = 10) => [...rows].sort((a, b) => b.value - a.value).slice(0, n);
const round = (n: number) => Math.round(n * 100) / 100;

// Food cost here is the AED value of what was used (consumption) plus what was thrown away (wastage).
export async function buildStockReport(from: string, to: string): Promise<StockReport> {
  const today = todayISO();
  const slowFrom = addDaysISO(today, -30);

  const [items, levels, movements, recentUse, lastUse, bills, billLines, openOrders, unseenAlerts] = await Promise.all([
    readAll<{ id: string; name: string; base_unit: string; avg_cost: number; last_price: number | null; active: boolean }>((a, b) =>
      supabaseAdmin.from("stock_items").select("id, name, base_unit, avg_cost, last_price, active").range(a, b)
    ),
    readAll<{ item_id: string; qty: number }>((a, b) => supabaseAdmin.from("stock_levels").select("item_id, qty").range(a, b)),
    readAll<{ item_id: string; type: string; qty: number; unit_cost: number; entry_date: string; reason: string | null }>((a, b) =>
      supabaseAdmin
        .from("stock_movements")
        .select("item_id, type, qty, unit_cost, entry_date, reason")
        .in("type", ["consumption", "wastage"])
        .gte("entry_date", from)
        .lte("entry_date", to)
        .range(a, b)
    ),
    readAll<{ item_id: string; qty: number }>((a, b) =>
      supabaseAdmin.from("stock_movements").select("item_id, qty").eq("type", "consumption").gte("entry_date", slowFrom).range(a, b)
    ),
    readAll<{ item_id: string; entry_date: string }>((a, b) =>
      supabaseAdmin.from("stock_movements").select("item_id, entry_date").eq("type", "consumption").order("entry_date", { ascending: false }).range(a, b)
    ),
    readAll<{ id: string; bill_date: string; total: number; suppliers: { name: string } | null }>((a, b) =>
      supabaseAdmin.from("purchase_bills").select("id, bill_date, total, suppliers(name)").gte("bill_date", from).lte("bill_date", to).range(a, b) as never
    ),
    readAll<{ item_id: string; base_qty: number; line_total: number; purchase_bills: { bill_date: string } }>((a, b) =>
      supabaseAdmin
        .from("purchase_bill_lines")
        .select("item_id, base_qty, line_total, purchase_bills!inner(bill_date)")
        .gte("purchase_bills.bill_date", from)
        .lte("purchase_bills.bill_date", to)
        .range(a, b) as never
    ),
    supabaseAdmin.from("purchase_orders").select("id", { count: "exact", head: true }).in("status", ["submitted", "approved"]),
    supabaseAdmin.from("price_alerts").select("id", { count: "exact", head: true }).is("seen_at", null),
  ]);

  const byId = new Map(items.map((i) => [i.id, i]));
  const qtyById = new Map(levels.map((l) => [l.item_id, Number(l.qty)]));
  const row = (id: string): ItemRow => ({ item_id: id, name: byId.get(id)?.name ?? "?", unit: byId.get(id)?.base_unit ?? "", qty: 0, value: 0 });

  // Day by day
  const days = new Map<string, { consumption: number; wastage: number; purchases: number }>();
  for (let d = from; d <= to; d = addDaysISO(d, 1)) days.set(d, { consumption: 0, wastage: 0, purchases: 0 });

  const consumed = new Map<string, ItemRow>();
  const wasted = new Map<string, ItemRow>();
  const reasons = new Map<string, { reason: string; value: number; entries: number }>();
  let consumption = 0;
  let wastage = 0;
  for (const m of movements) {
    const qty = -Number(m.qty);
    const value = qty * Number(m.unit_cost);
    const target = m.type === "consumption" ? consumed : wasted;
    const r = target.get(m.item_id) ?? row(m.item_id);
    r.qty += qty;
    r.value += value;
    target.set(m.item_id, r);
    const day = days.get(m.entry_date);
    if (m.type === "consumption") {
      consumption += value;
      if (day) day.consumption += value;
    } else {
      wastage += value;
      if (day) day.wastage += value;
      const key = m.reason || "Not given";
      const w = reasons.get(key) ?? { reason: key, value: 0, entries: 0 };
      w.value += value;
      w.entries += 1;
      reasons.set(key, w);
    }
  }

  const bought = new Map<string, ItemRow>();
  for (const l of billLines) {
    const r = bought.get(l.item_id) ?? row(l.item_id);
    r.qty += Number(l.base_qty);
    r.value += Number(l.line_total);
    bought.set(l.item_id, r);
  }

  const supplierTotals = new Map<string, { name: string; total: number; bills: number }>();
  let purchases = 0;
  for (const b of bills) {
    purchases += Number(b.total);
    const day = days.get(b.bill_date);
    if (day) day.purchases += Number(b.total);
    const name = b.suppliers?.name ?? "No supplier";
    const s = supplierTotals.get(name) ?? { name, total: 0, bills: 0 };
    s.total += Number(b.total);
    s.bills += 1;
    supplierTotals.set(name, s);
  }

  // Slow movers: in stock but not used in the last 30 days (or barely used compared to the stock held).
  const used30 = new Map<string, number>();
  for (const u of recentUse) used30.set(u.item_id, (used30.get(u.item_id) ?? 0) - Number(u.qty));
  const lastUsed = new Map<string, string>();
  for (const u of lastUse) if (!lastUsed.has(u.item_id)) lastUsed.set(u.item_id, u.entry_date);
  const slowMovers = items
    .filter((i) => i.active && (qtyById.get(i.id) ?? 0) > 0)
    .map((i) => {
      const qty = qtyById.get(i.id) ?? 0;
      const perDay = (used30.get(i.id) ?? 0) / 30;
      return {
        item_id: i.id,
        name: i.name,
        unit: i.base_unit,
        qty,
        value: round(qty * Number(i.avg_cost)),
        lastUsed: lastUsed.get(i.id) ?? null,
        daysOfStock: perDay > 0 ? Math.round(qty / perDay) : null,
      };
    })
    .filter((s) => s.daysOfStock === null || s.daysOfStock > 30)
    .sort((a, b) => b.value - a.value || b.qty - a.qty)
    .slice(0, 25);

  const stockValue = items.reduce((sum, i) => sum + Math.max(qtyById.get(i.id) ?? 0, 0) * Number(i.avg_cost), 0);
  const fix = (rows: ItemRow[]) => rows.map((r) => ({ ...r, qty: round(r.qty), value: round(r.value) }));

  return {
    from,
    to,
    totals: {
      purchases: round(purchases),
      consumption: round(consumption),
      wastage: round(wastage),
      foodCost: round(consumption + wastage),
      stockValue: round(stockValue),
      bills: bills.length,
    },
    daily: [...days].map(([date, d]) => ({ date, consumption: round(d.consumption), wastage: round(d.wastage), purchases: round(d.purchases) })),
    topBought: fix(top([...bought.values()])),
    mostConsumed: fix(top([...consumed.values()])),
    mostWasted: fix(top([...wasted.values()])),
    mostExpensive: items
      .filter((i) => i.active && Number(i.avg_cost) > 0)
      .sort((a, b) => Number(b.avg_cost) - Number(a.avg_cost))
      .slice(0, 10)
      .map((i) => ({ item_id: i.id, name: i.name, unit: i.base_unit, avg_cost: Number(i.avg_cost), last_price: i.last_price === null ? null : Number(i.last_price) })),
    slowMovers,
    wastageByReason: [...reasons.values()].map((r) => ({ ...r, value: round(r.value) })).sort((a, b) => b.value - a.value),
    suppliers: [...supplierTotals.values()].map((s) => ({ ...s, total: round(s.total) })).sort((a, b) => b.total - a.total),
    openOrders: openOrders.count ?? 0,
    unseenAlerts: unseenAlerts.count ?? 0,
  };
}

export function reportRange(fromParam: string | null, toParam: string | null) {
  const today = todayISO();
  const valid = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  let to = valid(toParam) ?? today;
  if (to > today) to = today;
  let from = valid(fromParam) ?? addDaysISO(to, -29);
  if (from > to) from = to;
  // At most a year at a time.
  if (from < addDaysISO(to, -366)) from = addDaysISO(to, -366);
  return { from, to };
}
