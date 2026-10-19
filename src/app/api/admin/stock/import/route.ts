import { NextRequest, NextResponse } from "next/server";
import { requireStock } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { parseStockWorkbook } from "@/lib/stock/importItems";

// Vercel serverless functions reject request bodies above 4.5 MB.
const MAX_BYTES = 4 * 1024 * 1024;

// POST with form fields: file, mode ("preview" | "import"), sheets (JSON list of sheet names, import only).
export async function POST(request: NextRequest) {
  const auth = await requireStock("manager");
  if ("denied" in auth) return auth.denied;
  const limited = await enforceRateLimit("stock-import", request, { limit: 30, windowSec: 15 * 60 });
  if (limited) return limited;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (!/\.xlsx$/i.test(file.name)) return NextResponse.json({ error: "Please upload an .xlsx file." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is too large (max 4 MB)." }, { status: 400 });

  let sheets;
  try {
    sheets = await parseStockWorkbook(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error("Stock import parse failed", err);
    return NextResponse.json({ error: "Could not read that file. Check that it is a valid .xlsx." }, { status: 422 });
  }
  if (sheets.length === 0) {
    return NextResponse.json({ error: "No item list found. The sheet needs an \"Item Name\" column." }, { status: 422 });
  }

  // Which names already exist, so the preview can say "new" or "update".
  const { data: existing, error: existingError } = await supabaseAdmin.from("stock_items").select("name").limit(5000);
  if (existingError) {
    console.error("Could not read existing items", existingError);
    return NextResponse.json({ error: "Could not check existing items." }, { status: 500 });
  }
  const existingNames = new Set((existing ?? []).map((r) => String(r.name).trim().toLowerCase()));

  if (formData?.get("mode") !== "import") {
    return NextResponse.json({
      sheets: sheets.map((s) => ({
        name: s.name,
        recommended: s.recommended,
        count: s.rows.length,
        withUnit: s.withUnit,
        newCount: s.rows.filter((r) => !existingNames.has(r.name.toLowerCase())).length,
        problems: s.problems,
        sample: s.rows.slice(0, 8),
      })),
    });
  }

  let chosen: string[] = [];
  try {
    chosen = JSON.parse(String(formData.get("sheets") ?? "[]"));
  } catch {
    chosen = [];
  }
  // The same item name can appear on two sheets; the first one wins.
  const seen = new Set<string>();
  const rows = sheets
    .filter((s) => chosen.includes(s.name))
    .flatMap((s) => s.rows)
    .filter((r) => {
      const key = r.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (rows.length === 0) return NextResponse.json({ error: "Choose at least one sheet to import." }, { status: 400 });

  const { data, error } = await supabaseAdmin.rpc("import_stock_items", { p_rows: rows, p_by: auth.session.username });
  if (error) {
    console.error("Stock import failed", error);
    return NextResponse.json({ error: "The import failed, nothing was changed. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ result: data });
}
