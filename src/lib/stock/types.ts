// Shared by the stock screens and API routes (no server-only imports).

export const UNITS = [
  "kg", "g", "L", "ml", "pcs", "pack", "box", "carton", "tray", "bottle", "can", "jar", "bag", "sack", "bundle", "dozen",
] as const;

export const CATEGORY_ORDER = [
  "Meat",
  "Seafood",
  "Vegetables & Fruits",
  "Dairy & Eggs",
  "Dry Store",
  "Beverages",
  "Packing & Cleaning",
  "Utensils & Equipment",
  "General",
];

export type StockItem = {
  id: string;
  name: string;
  category: string;
  sub_category: string | null;
  brand: string | null;
  pack_size: string | null;
  aliases: string | null;
  base_unit: string;
  purchase_unit: string | null;
  purchase_factor: number;
  par_level: number | null;
  reorder_qty: number | null;
  default_supplier_id: string | null;
  notes: string | null;
  active: boolean;
  qty: number;
  // Only sent to heads and the owner.
  avg_cost?: number;
  last_price?: number | null;
  has_movements?: boolean;
};

export type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
};

export function sortCategories(categories: string[]) {
  return [...categories].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
}

export function formatQty(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("en-GB", { maximumFractionDigits: 3 });
}

export function formatAed(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `AED ${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Matches name, brand, sub-category and the old register names, so "bulalao" finds "Beef Shank (Bulalo)".
export function itemMatches(item: Pick<StockItem, "name" | "brand" | "sub_category" | "aliases">, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.name, item.brand, item.sub_category, item.aliases].some((v) => v?.toLowerCase().includes(q));
}
