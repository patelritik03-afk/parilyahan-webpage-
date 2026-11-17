import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireSpin } from "@/lib/auth";
import { SITE_URL } from "@/lib/siteUrl";
import { cleanSource } from "@/lib/spin/text";

// A QR code (PNG) for printing or ads: opens /spin and records where the player came from.
export async function GET(request: NextRequest) {
  const auth = await requireSpin("manager");
  if ("denied" in auth) return auth.denied;
  const source = cleanSource(request.nextUrl.searchParams.get("src"));
  const url = `${SITE_URL}/spin?src=${source}`;
  const png = await QRCode.toBuffer(url, { type: "png", width: 1200, margin: 2, errorCorrectionLevel: "H", color: { dark: "#161616", light: "#ffffff" } });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="spin-qr-${source}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
