import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireStock } from "@/lib/auth";
import { buildStockReport, reportRange } from "@/lib/stock/reports";

// The report as an Excel file, one sheet per table.
export async function GET(request: NextRequest) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;
  const params = request.nextUrl.searchParams;
  const { from, to } = reportRange(params.get("from"), params.get("to"));
  const r = await buildStockReport(from, to);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Parilyahan Sa Kalye";
  const sheet = (name: string, columns: { header: string; key: string; width: number }[], rows: object[]) => {
    const ws = wb.addWorksheet(name);
    ws.columns = columns;
    rows.forEach((row) => ws.addRow(row));
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1121F" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };

  sheet(
    "Summary",
    [
      { header: "Measure", key: "k", width: 34 },
      { header: "AED", key: "v", width: 16 },
    ],
    [
      { k: `Period ${from} to ${to}`, v: "" },
      { k: "Purchases (bills)", v: r.totals.purchases },
      { k: "Consumption", v: r.totals.consumption },
      { k: "Wastage", v: r.totals.wastage },
      { k: "Food cost (consumption + wastage)", v: r.totals.foodCost },
      { k: "Stock value now", v: r.totals.stockValue },
      { k: "Bills entered", v: r.totals.bills },
    ]
  );
  sheet(
    "Daily",
    [
      { header: "Date", key: "date", width: 12 },
      { header: "Consumption", key: "consumption", width: 14 },
      { header: "Wastage", key: "wastage", width: 12 },
      { header: "Food cost", key: "food", width: 12 },
      { header: "Purchases", key: "purchases", width: 12 },
    ],
    r.daily.map((d) => ({ ...d, food: Math.round((d.consumption + d.wastage) * 100) / 100 }))
  );
  const itemCols = [
    { header: "Item", key: "name", width: 34 },
    { header: "Qty", key: "qty", width: 10 },
    { header: "Unit", key: "unit", width: 8 },
    { header: "AED", key: "value", width: 12 },
  ];
  sheet("Top bought", itemCols, r.topBought);
  sheet("Most consumed", itemCols, r.mostConsumed);
  sheet("Most wasted", itemCols, r.mostWasted);
  sheet(
    "Most expensive",
    [
      { header: "Item", key: "name", width: 34 },
      { header: "Unit", key: "unit", width: 8 },
      { header: "Average cost", key: "avg_cost", width: 14 },
      { header: "Last price", key: "last_price", width: 12 },
    ],
    r.mostExpensive
  );
  sheet(
    "Slow movers",
    [
      { header: "Item", key: "name", width: 34 },
      { header: "In stock", key: "qty", width: 10 },
      { header: "Unit", key: "unit", width: 8 },
      { header: "Value AED", key: "value", width: 12 },
      { header: "Last used", key: "lastUsed", width: 12 },
      { header: "Days of stock", key: "daysOfStock", width: 13 },
    ],
    r.slowMovers
  );
  sheet(
    "Wastage reasons",
    [
      { header: "Reason", key: "reason", width: 24 },
      { header: "Entries", key: "entries", width: 10 },
      { header: "AED", key: "value", width: 12 },
    ],
    r.wastageByReason
  );
  sheet(
    "Suppliers",
    [
      { header: "Supplier", key: "name", width: 30 },
      { header: "Bills", key: "bills", width: 8 },
      { header: "AED", key: "total", width: 14 },
    ],
    r.suppliers
  );

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stock-report-${from}-to-${to}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
