import { NextRequest, NextResponse } from "next/server";
import { parseMenuFile } from "@/lib/menuImport";
import { requireAdmin } from "@/lib/auth";

// Vercel serverless functions reject request bodies above 4.5 MB.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!/\.(xlsx|csv)$/i.test(file.name)) {
    return NextResponse.json({ error: "Please upload an .xlsx or .csv file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 4 MB)." }, { status: 400 });
  }

  try {
    const result = await parseMenuFile(file.name, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(result);
  } catch (err) {
    console.error("Menu import parse failed", err);
    return NextResponse.json(
      { error: "Could not read that file. Check that it is a valid .xlsx or .csv." },
      { status: 422 }
    );
  }
}
