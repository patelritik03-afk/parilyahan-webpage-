// Shared by the stock screens and API routes (no server-only imports).

export const UNITS = [
  "kg", "g", "L", "ml", "gal", "pcs", "pack", "box", "carton", "tray", "bottle", "can", "jar", "bag", "sack", "bundle",
  "roll", "set", "dozen",
] as const;

// Spellings seen in registers and supplier bills, mapped to the units above.
const UNIT_ALIASES: Record<string, string> = {
  kg: "kg", kgs: "kg", kilo: "kg", kilos: "kg", kilogram: "kg", kilograms: "kg",
  g: "g", gm: "g", gms: "g", gr: "g", grm: "g", gram: "g", grams: "g",
  l: "L", lt: "L", ltr: "L", ltrs: "L", litre: "L", litres: "L", liter: "L", liters: "L",
  ml: "ml", mls: "ml",
  gal: "gal", gals: "gal", gallon: "gal", gallons: "gal",
  pcs: "pcs", pc: "pcs", piece: "pcs", pieces: "pcs", nos: "pcs", no: "pcs", ea: "pcs", each: "pcs", unit: "pcs", units: "pcs",
  pkt: "pack", pkts: "pack", pack: "pack", packs: "pack", packet: "pack", packets: "pack", pk: "pack",
  ctn: "carton", ctns: "carton", carton: "carton", cartons: "carton", cs: "carton", case: "carton", cases: "carton",
  box: "box", boxes: "box", bx: "box",
  tray: "tray", trays: "tray",
  btl: "bottle", btls: "bottle", bottle: "bottle", bottles: "bottle",
  can: "can", cans: "can", tin: "can", tins: "can",
  jar: "jar", jars: "jar",
  bag: "bag", bags: "bag",
  sack: "sack", sacks: "sack",
  bdl: "bundle", bdls: "bundle", bundle: "bundle", bundles: "bundle",
  roll: "roll", rolls: "roll", rl: "roll",
  set: "set", sets: "set",
  dozen: "dozen", dz: "dozen", doz: "dozen",
};

// "Ltr" -> "L", "CTN" -> "carton", "pkt" -> "pack". Unknown units are kept as written.
export function normalizeUnit(value: string) {
  const raw = value.trim();
  const key = raw.toLowerCase().replace(/[.\s]/g, "");
  return UNIT_ALIASES[key] ?? raw.slice(0, 20);
}

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
  // Suggested from a month of usage records (heads and the owner only).
  suggested_par?: number | null;
};

export type ParInfo = { daysOfRecords: number; ready: boolean; historyDays: number; coverDays: number };

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
