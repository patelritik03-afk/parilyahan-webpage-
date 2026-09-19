import "server-only";
import { Resend } from "resend";
import type { Reservation } from "./types";
import type { EnquiryPayload } from "./enquiry";
import { formatTimeLabel } from "./timeSlots";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const row = (label: string, value: string | number | undefined) =>
  value === undefined || value === "" ? "" : `<p><strong>${label}:</strong> ${escapeHtml(String(value))}</p>`;

async function send(options: Parameters<typeof resend.emails.send>[0]) {
  const { error } = await resend.emails.send(options);
  if (error) throw new Error(`Resend: ${error.message}`);
  return true;
}

export async function sendOwnerReservationEmail(reservation: Reservation) {
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!from || !to) return false;

  return send({
    from,
    to,
    replyTo: reservation.email,
    subject: `New reservation: ${reservation.name} - ${reservation.date} ${formatTimeLabel(reservation.time)}`,
    html: `
      <h2>New Reservation</h2>
      ${row("Name", reservation.name)}
      ${row("Phone", reservation.phone)}
      ${row("Email", reservation.email)}
      ${row("Date", reservation.date)}
      ${row("Time", formatTimeLabel(reservation.time))}
      ${row("Party size", reservation.party_size)}
      ${row("Notes", reservation.notes ?? "")}
    `,
  });
}

export async function sendCustomerConfirmationEmail(reservation: Reservation) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) return false;

  return send({
    from,
    to: reservation.email,
    subject: `Your reservation at ${process.env.NEXT_PUBLIC_SITE_NAME ?? "Parilyahan Sa Kalye"} is confirmed`,
    html: `
      <h2>You're booked!</h2>
      <p>Hi ${escapeHtml(reservation.name)}, we've confirmed your table.</p>
      ${row("Date", reservation.date)}
      ${row("Time", formatTimeLabel(reservation.time))}
      ${row("Party size", reservation.party_size)}
      <p>If you need to change anything, just reply to this email or message us on WhatsApp.</p>
      <p>See you soon!</p>
    `,
  });
}

export async function sendOwnerEnquiryEmail(enquiry: EnquiryPayload) {
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!from || !to) return false;

  return send({
    from,
    to,
    replyTo: enquiry.email,
    subject: `New enquiry (${enquiry.type}): ${enquiry.name}`,
    html: `
      <h2>New Enquiry - ${escapeHtml(enquiry.type)}</h2>
      ${row("Name", enquiry.name)}
      ${row("Mobile", enquiry.phone)}
      ${row("Email", enquiry.email)}
      ${row("Specified", enquiry.specify)}
      ${row("Event type", enquiry.eventType)}
      ${row("No. of pax", enquiry.pax)}
      ${row("Event date", enquiry.eventDate)}
      ${row("Message", enquiry.message)}
    `,
  });
}
