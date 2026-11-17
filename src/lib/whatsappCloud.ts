import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// WhatsApp Cloud API (Meta). Free-form text replies are free inside the 24 h window after the
// customer messages us; outside it only approved templates can be sent.
const GRAPH = "https://graph.facebook.com/v21.0";

export function whatsappCloudReady() {
  return Boolean(process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

async function post(body: Record<string, unknown>) {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return false;
  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`WhatsApp Cloud API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return true;
}

// `to` is the number in digits with country code, e.g. 971501234567.
export function sendWhatsAppText(to: string, text: string) {
  return post({ to, type: "text", text: { preview_url: false, body: text } });
}

// One-time code via an approved "authentication" template (paid per message).
export function sendWhatsAppOtp(to: string, code: string) {
  const name = process.env.WHATSAPP_OTP_TEMPLATE;
  if (!name) return Promise.resolve(false);
  return post({
    to,
    type: "template",
    template: {
      name,
      language: { code: process.env.WHATSAPP_OTP_TEMPLATE_LANG || "en" },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
      ],
    },
  });
}

// Meta signs every webhook call with the app secret; anything else is rejected.
export function validWebhookSignature(rawBody: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const given = header.slice(7);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));
}
