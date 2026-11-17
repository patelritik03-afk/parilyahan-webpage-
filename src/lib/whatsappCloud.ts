import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// WhatsApp Cloud API. Free-form text replies are free inside the 24 h window after the
// customer messages us; outside it only approved templates can be sent.
// Two ways to connect:
//  - directly to Meta: WHATSAPP_CLOUD_TOKEN + WHATSAPP_PHONE_NUMBER_ID (+ WHATSAPP_APP_SECRET for webhooks)
//  - through a provider such as Chakra (needed to keep the number on the phone app, "coexistence"):
//    WHATSAPP_MESSAGES_URL = the provider's Meta-compatible ".../messages" address, WHATSAPP_CLOUD_TOKEN = its API key,
//    and webhooks are trusted by WHATSAPP_WEBHOOK_KEY (in the URL) or WHATSAPP_CHAKRA_SECRET (signature).
const GRAPH = "https://graph.facebook.com/v21.0";

function messagesUrl() {
  if (process.env.WHATSAPP_MESSAGES_URL) return process.env.WHATSAPP_MESSAGES_URL;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return phoneId ? `${GRAPH}/${phoneId}/messages` : null;
}

export function whatsappCloudReady() {
  return Boolean(process.env.WHATSAPP_CLOUD_TOKEN && messagesUrl());
}

async function post(body: Record<string, unknown>) {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const url = messagesUrl();
  if (!token || !url) return false;
  const res = await fetch(url, {
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

function hmacMatches(secret: string | undefined, rawBody: string, header: string | null) {
  if (!secret || !header) return false;
  const given = header.replace(/^sha256=/, "").trim().toLowerCase();
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  if (!/^[0-9a-f]+$/.test(given) || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));
}

function sameSecret(a: string | null, b: string | undefined) {
  if (!a || !b || b.length < 24) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Only messages that really come from WhatsApp may verify players. Accepted:
//  - Meta's signature (X-Hub-Signature-256, our own app secret) when connected directly,
//  - Chakra's signature (X-Chakra-Signature-256) when connected through Chakra,
//  - or the secret key in the webhook URL (?key=...), for providers that forward without signing.
export function trustedWebhook(rawBody: string, headers: Headers, urlKey: string | null) {
  return (
    hmacMatches(process.env.WHATSAPP_APP_SECRET, rawBody, headers.get("x-hub-signature-256")) ||
    hmacMatches(process.env.WHATSAPP_CHAKRA_SECRET, rawBody, headers.get("x-chakra-signature-256")) ||
    sameSecret(urlKey, process.env.WHATSAPP_WEBHOOK_KEY)
  );
}
