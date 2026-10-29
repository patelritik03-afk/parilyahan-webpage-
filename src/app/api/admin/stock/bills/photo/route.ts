import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireStock } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Bill photos go to a private bucket; they are only shown through short-lived signed links.
export async function POST(request: NextRequest) {
  const auth = await requireStock();
  if ("denied" in auth) return auth.denied;
  const limited = await enforceRateLimit("stock-bill-photo", request, { limit: 60, windowSec: 10 * 60 });
  if (limited) return limited;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo provided." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Please upload a JPG, PNG or WebP photo." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "The photo is too large (max 4 MB)." }, { status: 400 });

  const month = new Date().toISOString().slice(0, 7);
  const path = `bills/${month}/${randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from("stock-bills")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) {
    console.error("Could not upload bill photo", error);
    return NextResponse.json({ error: "Could not upload the photo." }, { status: 500 });
  }
  return NextResponse.json({ path });
}
