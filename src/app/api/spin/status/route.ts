import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";

// Polled every 2 s while the customer verifies on WhatsApp.
export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit("spin-status", request, { limit: 400, windowSec: 10 * 60 });
  if (limited) return limited;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (token.length < 20) return NextResponse.json({ error: "bad-token" }, { status: 400 });
  const { data } = await supabaseAdmin.from("spin_players").select("verified_at, code_expires_at").eq("token", token).maybeSingle();
  if (!data) return NextResponse.json({ error: "bad-token" }, { status: 404 });
  return NextResponse.json(
    {
      verified: Boolean(data.verified_at),
      expired: !data.verified_at && (!data.code_expires_at || Date.parse(data.code_expires_at) < Date.now()),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
