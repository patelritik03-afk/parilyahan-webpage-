import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppText, trustedWebhook } from "@/lib/whatsappCloud";

// Meta checks the webhook once with a GET (hub.challenge).
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (expected && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === expected) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type InboundMessage = { from: string; type: string; text?: { body?: string } };

const VERIFIED_REPLY = [
  "✅ Verified! Go back to the screen and SPIN the wheel! 🎡",
  "✅ Verified na! Bumalik sa screen at IKOT na! 🎡",
].join("\n");
const FAILED_REPLY = [
  "Sorry, this code is not valid or has expired. Please start again on the Spin & Win page.",
  "Pasensya, mali o expired na ang code. Magsimula ulit sa Spin & Win page.",
].join("\n");

// Spin & Win "verify on WhatsApp": the customer sends "PSK 123456" from their own WhatsApp.
// The sender's number is proven by WhatsApp; we match it with the number they typed.
async function handle(message: InboundMessage) {
  const from = message.from.replace(/\D/g, "");
  const phone = `+${from}`;
  const now = new Date().toISOString();

  // Remember when they last wrote to us: replies are free for 24 h after that.
  const { data: customer } = await supabaseAdmin.from("spin_customers").select("id").eq("phone", phone).maybeSingle();
  if (customer) await supabaseAdmin.from("spin_customers").update({ wa_last_inbound_at: now, last_seen: now }).eq("id", customer.id);

  const match = /PSK\s*-?\s*(\d{6})/i.exec(message.text?.body ?? "");
  if (message.type !== "text" || !match) return; // ordinary chats are left for the team
  if (!customer) {
    await sendWhatsAppText(from, FAILED_REPLY);
    return;
  }
  const { data: player } = await supabaseAdmin
    .from("spin_players")
    .select("id, code_expires_at, verified_at")
    .eq("customer_id", customer.id)
    .eq("verify_code", match[1])
    .maybeSingle();
  if (!player || player.verified_at || !player.code_expires_at || Date.parse(player.code_expires_at) < Date.now()) {
    await sendWhatsAppText(from, FAILED_REPLY);
    return;
  }
  await supabaseAdmin.from("spin_players").update({ verified_at: now, verify_code: null }).eq("id", player.id);
  await supabaseAdmin.from("spin_customers").update({ verified_at: now }).eq("id", customer.id);
  await sendWhatsAppText(from, VERIFIED_REPLY);
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!trustedWebhook(raw, request.headers, request.nextUrl.searchParams.get("key"))) {
    return new NextResponse("Not trusted", { status: 401 });
  }
  let payload: { entry?: { changes?: { value?: { messages?: InboundMessage[] } }[] }[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  const messages = (payload.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? []));
  for (const message of messages) {
    try {
      await handle(message);
    } catch (err) {
      console.error("WhatsApp webhook message failed", err);
    }
  }
  // Always 200 so Meta does not keep retrying.
  return NextResponse.json({ ok: true });
}
