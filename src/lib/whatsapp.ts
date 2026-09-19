import "server-only";
import type { Reservation } from "./types";
import type { EnquiryPayload } from "./enquiry";
import { formatTimeLabel } from "./timeSlots";

// CallMeBot free WhatsApp webhook - notifies the owner's own phone only.
// Setup: https://www.callmebot.com/blog/free-api-whatsapp-messages/
async function sendToOwner(lines: (string | null | undefined)[]) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return false;

  const text = lines.filter(Boolean).join("\n");
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
    phone
  )}&apikey=${encodeURIComponent(apikey)}&text=${encodeURIComponent(text)}`;

  const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`CallMeBot responded ${res.status}`);
  return true;
}

export function sendOwnerWhatsAppNotification(reservation: Reservation) {
  return sendToOwner([
    `New reservation - ${reservation.name}`,
    `${reservation.date} at ${formatTimeLabel(reservation.time)}, party of ${reservation.party_size}`,
    `Phone: ${reservation.phone}`,
    reservation.notes ? `Notes: ${reservation.notes}` : null,
  ]);
}

export function sendOwnerEnquiryWhatsApp(enquiry: EnquiryPayload) {
  return sendToOwner([
    `New enquiry (${enquiry.type}) - ${enquiry.name}`,
    `Mobile: ${enquiry.phone}`,
    `Email: ${enquiry.email}`,
    enquiry.specify ? `About: ${enquiry.specify}` : null,
    enquiry.eventType ? `Event: ${enquiry.eventType}, ${enquiry.pax} pax on ${enquiry.eventDate}` : null,
    enquiry.message ? `Message: ${enquiry.message}` : null,
  ]);
}
