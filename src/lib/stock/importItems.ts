import "server-only";
import ExcelJS from "exceljs";
import { UNITS, normalizeUnit } from "./types";

// Reads two kinds of workbook:
//  1. The owner's "Food Stock List" (Item Name, Category, Sub-category, Brand / Variant, Size / Pack,
//     Original Name(s) in Register) plus optional "Packing" and "Utensils & Equipment" sheets.
//  2. The "Stock Items" workbook this app exports, with units, par levels, supplier, cost and opening stock
//     filled in by the owner, so it can be imported again to update the items.

export type ImportRow = {
  name: string;
  category: string;
  sub_category?: string;
  brand?: string;
  pack_size?: string;
  aliases?: string;
  base_unit?: string;
  purchase_unit?: string;
  purchase_factor?: number;
  par_level?: number;
  reorder_qty?: number;
  supplier?: string;
  unit_cost?: number;
  opening_qty?: number;
};

export type ImportSheet = {
  name: string;
  rows: ImportRow[];
  // How many rows have a unit in the file.
  withUnit: number;
  // Selected by default: the main food list and this app's own export.
  recommended: boolean;
  problems: string[];
};

const MAX_ROWS = 3000;

// Sheets in the owner's file that are not stock items.
const SKIP_SHEETS = /not stock|mapping|brandlist|sizelist|unitlist/i;

// Sheets without a Category column get one from the sheet name.
const SHEET_CATEGORY: [RegExp, string][] = [
  [/packing|cleaning/i, "Packing & Cleaning"],
  [/utensil|equipment/i, "Utensils & Equipment"],
];

type Field = keyof ImportRow;
const HEADERS: Record<string, Field> = {
  itemname: "name",
  nameinregister: "name",
  name: "name",
  item: "name",
  category: "category",
  subcategory: "sub_category",
  type: "sub_category",
  brandvariant: "brand",
  brand: "brand",
  sizepack: "pack_size",
  packsize: "pack_size",
  size: "pack_size",
  originalnamesinregister: "aliases",
  aliases: "aliases",
  alsosearchas: "aliases",
  baseunit: "base_unit",
  unit: "base_unit",
  units: "base_unit",
  uom: "base_unit",
  unitofmeasure: "base_unit",
  unitofmeasurement: "base_unit",
  purchaseunit: "purchase_unit",
  baseunitsperpurchaseunit: "purchase_factor",
  purchasefactor: "purchase_factor",
  parlevel: "par_level",
  par: "par_level",
  reorderqty: "reorder_qty",
  supplier: "supplier",
  defaultsupplier: "supplier",
  costperbaseunitaed: "unit_cost",
  unitcost: "unit_cost",
  openingstock: "opening_qty",
  openingqty: "opening_qty",
};
const NUMBER_FIELDS = new Set<Field>(["purchase_factor", "par_level", "reorder_qty", "unit_cost", "opening_qty"]);

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((r) => r.text).join("");
    if ("result" in value && value.result !== undefined) return cellText(value.result as ExcelJS.CellValue);
    if ("text" in value) return String(value.text);
    return "";
  }
  return String(value);
}

const clean = (v: string) => v.replace(/\s+/g, " ").trim();
// "Brand / Variant" -> "brandvariant", "Cost per base unit (AED)" -> "costperbaseunitaed".
const headerKey = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");

function aliasesFrom(raw: string, name: string) {
  const parts = raw
    .split("|")
    .map(clean)
    .filter((p) => p && p !== "-" && p.toLowerCase() !== name.toLowerCase());
  return [...new Set(parts)].join(" | ").slice(0, 500);
}

function parseSheet(ws: ExcelJS.Worksheet): ImportSheet | null {
  if (SKIP_SHEETS.test(ws.name)) return null;
  const rowCount = Math.min(ws.rowCount, MAX_ROWS);

  // The header row is the first of the top 10 rows that has a name column.
  let headerRow = 0;
  let columns: { col: number; field: Field }[] = [];
  for (let r = 1; r <= Math.min(10, rowCount); r++) {
    const found: { col: number; field: Field }[] = [];
    ws.getRow(r).eachCell((cell, col) => {
      const field = HEADERS[headerKey(cellText(cell.value))];
      if (field && !found.some((f) => f.field === field)) found.push({ col, field });
    });
    if (found.some((f) => f.field === "name")) {
      headerRow = r;
      columns = found;
      break;
    }
  }
  if (!headerRow) return null;

  const hasCategory = columns.some((c) => c.field === "category");
  const sheetCategory = SHEET_CATEGORY.find(([re]) => re.test(ws.name))?.[1] ?? "General";
  // This app's own export has par levels and conversion factors; the owner's list does not.
  const isAppExport = columns.some((c) => c.field === "purchase_factor" || c.field === "par_level");
  let withUnit = 0;
  const problems: string[] = [];
  const rows: ImportRow[] = [];
  const seen = new Set<string>();

  for (let r = headerRow + 1; r <= rowCount; r++) {
    const row = ws.getRow(r);
    const values: Partial<Record<Field, string>> = {};
    for (const { col, field } of columns) values[field] = clean(cellText(row.getCell(col).value));
    const name = (values.name ?? "").slice(0, 120);
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) {
      problems.push(`Row ${r}: "${name}" appears twice in this sheet, the second one is skipped.`);
      continue;
    }
    seen.add(key);

    const category = (hasCategory && values.category) || sheetCategory;
    const item: ImportRow = { name, category: category.slice(0, 60) };
    if (values.sub_category) item.sub_category = values.sub_category.slice(0, 60);
    if (values.brand) item.brand = values.brand.slice(0, 80);
    if (values.pack_size) item.pack_size = values.pack_size.slice(0, 60);
    if (values.aliases) item.aliases = aliasesFrom(values.aliases, name) || undefined;
    for (const field of ["base_unit", "purchase_unit"] as const) {
      const raw = values[field];
      if (!raw) continue;
      const unit = normalizeUnit(raw);
      if (!(UNITS as readonly string[]).includes(unit)) {
        problems.push(`Row ${r}: unit "${raw}" for ${name} is not a standard unit, it is kept as written.`);
      }
      item[field] = unit;
    }
    if (item.base_unit) withUnit++;
    if (values.supplier) item.supplier = values.supplier.slice(0, 120);

    for (const field of NUMBER_FIELDS) {
      const raw = values[field];
      if (!raw) continue;
      const n = Number(raw.replace(/,/g, ""));
      const invalid = !Number.isFinite(n) || n < 0 || n > 1_000_000 || (field === "purchase_factor" && n === 0);
      if (invalid) problems.push(`Row ${r}: "${raw}" is not a valid number for ${name}, it is left out.`);
      else (item[field] as number) = n;
    }

    // A missing unit is left empty here: the database gives new items kg or pcs by category,
    // and an existing item keeps the unit it already has.
    rows.push(item);
  }

  return {
    name: ws.name,
    rows,
    withUnit,
    recommended: hasCategory || isAppExport,
    problems: problems.slice(0, 50),
  };
}

export async function parseStockWorkbook(data: Buffer): Promise<ImportSheet[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data as unknown as ArrayBuffer);
  return workbook.worksheets.map(parseSheet).filter((s): s is ImportSheet => s !== null && s.rows.length > 0);
}
