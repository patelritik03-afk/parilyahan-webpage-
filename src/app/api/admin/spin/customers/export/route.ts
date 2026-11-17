import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireSpin } from "@/lib/auth";
import { listSpinCustomers } from "@/lib/spin/customers";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }) : "";

// The customer list as Excel (same filters as the screen).
export async function GET(request: NextRequest) {
  const auth = await requireSpin("manager");
  if ("denied" in auth) return auth.denied;
  const p = request.nextUrl.searchParams;
  const customers = await listSpinCustomers({ q: p.get("q") ?? "", consent: p.get("consent") === "1", verifiedOnly: p.get("all") !== "1" });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Parilyahan Sa Kalye";
  const ws = wb.addWorksheet("Customers");
  ws.columns = [
    { header: "Full name", key: "name", width: 28 },
    { header: "Mobile", key: "phone", width: 18 },
    { header: "Verified", key: "verified", width: 10 },
    { header: "Agreed to WhatsApp offers", key: "consent", width: 14 },
    { header: "Consent date", key: "consentAt", width: 20 },
    { header: "Came from", key: "sources", width: 18 },
    { header: "Prizes won", key: "prizes", width: 28 },
    { header: "Coupons used", key: "redeemed", width: 13 },
    { header: "Coupons unused", key: "active", width: 14 },
    { header: "First seen", key: "first", width: 20 },
    { header: "Last seen", key: "last", width: 20 },
  ];
  for (const c of customers) {
    ws.addRow({
      name: c.full_name,
      phone: c.phone,
      verified: c.verified ? "Yes" : "No",
      consent: c.consent ? "Yes" : "No",
      consentAt: fmt(c.consent_at),
      sources: c.sources.join(", "),
      prizes: c.prizes.join(", "),
      redeemed: c.redeemed,
      active: c.active,
      first: fmt(c.first_seen),
      last: fmt(c.last_seen),
    });
  }
  ws.getColumn("phone").numFmt = "@";
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1121F" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="spin-customers-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
