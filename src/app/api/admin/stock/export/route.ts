import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireStock } from "@/lib/auth";
import { listStockItems, listSuppliers } from "@/lib/stock/items";
import { sortCategories } from "@/lib/stock/types";

// The item list as an Excel file the owner can fill in (units, par levels, supplier, cost, opening stock)
// and import again on the Import screen. Grey columns are for reference only and are ignored on import.
export async function GET() {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;

  const [items, suppliers] = await Promise.all([listStockItems(true), listSuppliers()]);
  const supplierName = new Map(suppliers.map((s) => [s.id, s.name]));
  const order = sortCategories([...new Set(items.map((i) => i.category))]);
  items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Parilyahan Sa Kalye";
  const ws = wb.addWorksheet("Stock Items");
  ws.columns = [
    { header: "Item Name", key: "name", width: 34 },
    { header: "Category", key: "category", width: 20 },
    { header: "Sub-category", key: "sub", width: 20 },
    { header: "Brand / Variant", key: "brand", width: 18 },
    { header: "Size / Pack", key: "pack", width: 16 },
    { header: "Base unit", key: "unit", width: 11 },
    { header: "Purchase unit", key: "pUnit", width: 14 },
    { header: "Base units per purchase unit", key: "factor", width: 16 },
    { header: "Par level", key: "par", width: 11 },
    { header: "Reorder qty", key: "reorder", width: 12 },
    { header: "Supplier", key: "supplier", width: 22 },
    { header: "Cost per base unit (AED)", key: "cost", width: 16 },
    { header: "Opening stock", key: "opening", width: 14 },
    { header: "Current stock (info)", key: "stock", width: 14 },
    { header: "Current avg cost (info)", key: "avg", width: 14 },
    { header: "Also search as", key: "aliases", width: 40 },
  ];
  for (const item of items) {
    ws.addRow({
      name: item.name,
      category: item.category,
      sub: item.sub_category ?? "",
      brand: item.brand ?? "",
      pack: item.pack_size ?? "",
      unit: item.base_unit,
      pUnit: item.purchase_unit ?? "",
      factor: item.purchase_factor,
      par: item.par_level ?? "",
      reorder: item.reorder_qty ?? "",
      supplier: item.default_supplier_id ? supplierName.get(item.default_supplier_id) ?? "" : "",
      // Cost and opening stock only matter for items without stock entries yet; left empty to fill in.
      cost: "",
      opening: "",
      stock: item.qty,
      avg: item.avg_cost ?? 0,
      aliases: item.aliases ?? "",
    });
  }

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1121F" } };
  head.alignment = { wrapText: true, vertical: "middle" };
  head.height = 32;
  for (const key of ["stock", "avg"]) {
    ws.getColumn(key).eachCell((cell, row) => {
      if (row > 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDEDED" } };
    });
  }
  ws.views = [{ state: "frozen", ySplit: 1, xSplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

  const help = wb.addWorksheet("How to fill");
  help.getColumn(1).width = 110;
  [
    "How to fill this file",
    "",
    "Base unit: the unit you count and use the item in (kg, g, L, ml, pcs, pack, tray, bottle...).",
    "Purchase unit + Base units per purchase unit: how the supplier sells it. Example: Purchase unit = carton, 12 -> one carton is 12 pcs.",
    "Par level: the stock you want to always have, in the base unit. Below this, the item shows on 'What to buy'.",
    "Reorder qty: optional usual order amount in the base unit.",
    "Supplier: the usual supplier's name. A new name creates the supplier.",
    "Cost per base unit (AED) and Opening stock: only for items that have no stock entries yet (first setup).",
    "Grey columns are information only. Do not change Item Name, it is how rows are matched.",
    "Empty cells are ignored, so you can fill the file in several rounds and import it each time.",
  ].forEach((line, i) => {
    help.getCell(i + 1, 1).value = line;
    if (i === 0) help.getCell(i + 1, 1).font = { bold: true, size: 14 };
  });

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stock-items-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
