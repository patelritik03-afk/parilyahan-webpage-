import "server-only";
import { z } from "zod";
import { supabaseAdmin } from "../supabase";
import type { StockItem, Supplier } from "./types";

const ITEM_COLUMNS =
  "id, name, category, sub_category, brand, pack_size, aliases, base_unit, purchase_unit, purchase_factor, par_level, reorder_qty, default_supplier_id, notes, active, avg_cost, last_price";

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// Supabase returns at most 1000 rows per request, so large tables are read in pages.
async function readAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

// `withCosts` is true only for heads and the owner.
export async function listStockItems(withCosts: boolean): Promise<StockItem[]> {
  const [items, levels, moved] = await Promise.all([
    readAll<Record<string, unknown>>((from, to) =>
      supabaseAdmin.from("stock_items").select(ITEM_COLUMNS).order("name").range(from, to)
    ),
    readAll<{ item_id: string; qty: number }>((from, to) =>
      supabaseAdmin.from("stock_levels").select("item_id, qty").range(from, to)
    ),
    withCosts
      ? readAll<{ item_id: string }>((from, to) =>
          supabaseAdmin.from("stock_movements").select("item_id").range(from, to)
        )
      : Promise.resolve([]),
  ]);
  const qtyById = new Map(levels.map((l) => [l.item_id, Number(l.qty)]));
  const movedIds = new Set(moved.map((m) => m.item_id));

  return items.map((row) => {
    const item: StockItem = {
      id: String(row.id),
      name: String(row.name),
      category: String(row.category),
      sub_category: (row.sub_category as string) ?? null,
      brand: (row.brand as string) ?? null,
      pack_size: (row.pack_size as string) ?? null,
      aliases: (row.aliases as string) ?? null,
      base_unit: String(row.base_unit),
      purchase_unit: (row.purchase_unit as string) ?? null,
      purchase_factor: Number(row.purchase_factor),
      par_level: num(row.par_level),
      reorder_qty: num(row.reorder_qty),
      default_supplier_id: (row.default_supplier_id as string) ?? null,
      notes: (row.notes as string) ?? null,
      active: Boolean(row.active),
      qty: qtyById.get(String(row.id)) ?? 0,
    };
    if (withCosts) {
      item.avg_cost = Number(row.avg_cost);
      item.last_price = num(row.last_price);
      item.has_movements = movedIds.has(item.id);
    }
    return item;
  });
}

export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .select("id, name, contact_name, phone, email, notes, active")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();
const qty = z.number().min(0).max(1_000_000).nullable().optional();

export const itemInputSchema = z.object({
  name: z.string().trim().min(1, "Enter the item name.").max(120),
  category: z.string().trim().min(1).max(60),
  sub_category: text(60),
  brand: text(80),
  pack_size: text(60),
  aliases: text(500),
  base_unit: z.string().trim().min(1).max(20),
  purchase_unit: text(20),
  purchase_factor: z.number().positive().max(100_000),
  par_level: qty,
  reorder_qty: qty,
  default_supplier_id: z.uuid().nullable().optional(),
  notes: text(500),
  active: z.boolean().optional(),
});

export const supplierInputSchema = z.object({
  name: z.string().trim().min(1, "Enter the supplier name.").max(120),
  contact_name: text(80),
  phone: text(40),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email or leave it empty.")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  notes: text(500),
  active: z.boolean().optional(),
});

export function duplicateNameError(error: { code?: string } | null, what: string) {
  return error?.code === "23505" ? `${what} with this name already exists.` : null;
}
