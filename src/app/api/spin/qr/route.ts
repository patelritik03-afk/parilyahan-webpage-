import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase";
import { waLink } from "@/lib/spin/server";

// Kiosk: a QR code that opens WhatsApp on the customer's own phone with the verification message.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const { data } = await supabaseAdmin.from("spin_players").select("verify_code, verified_at").eq("token", token).maybeSingle();
  if (!data?.verify_code || data.verified_at) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const svg = await QRCode.toString(waLink(data.verify_code), { type: "svg", margin: 1, width: 320, errorCorrectionLevel: "M" });
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } });
}
