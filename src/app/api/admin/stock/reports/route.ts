import { NextRequest, NextResponse } from "next/server";
import { requireStock } from "@/lib/auth";
import { buildStockReport, reportRange } from "@/lib/stock/reports";

export async function GET(request: NextRequest) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;
  const params = request.nextUrl.searchParams;
  const { from, to } = reportRange(params.get("from"), params.get("to"));
  try {
    return NextResponse.json({ report: await buildStockReport(from, to) });
  } catch (err) {
    console.error("Could not build stock report", err);
    return NextResponse.json({ error: "Could not build the report." }, { status: 500 });
  }
}
