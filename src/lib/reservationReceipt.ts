import { formatTimeLabel } from "./timeSlots";
import { ADDRESS_LINES, PHONE_DISPLAY } from "./site";
import { OPEN_HOURS, WEEKDAY_PRICE, WEEKEND_PRICE } from "./seoPages";

export type ReceiptData = {
  id: string;
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  party_size: number;
  notes?: string | null;
  created_at?: string;
};

const RED: [number, number, number] = [193, 18, 31];
const DARK: [number, number, number] = [22, 22, 22];
const GREY: [number, number, number] = [110, 110, 110];
const GREEN: [number, number, number] = [30, 140, 70];

export function bookingReference(id: string) {
  return `PSK-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function longDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/brand/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Built in the customer's browser, so nothing about the booking is sent anywhere extra.
export async function downloadReservationReceipt(data: ReceiptData) {
  const doc = await buildReservationReceipt(data);
  doc.save(`reservation-${bookingReference(data.id)}.pdf`);
}

export async function buildReservationReceipt(data: ReceiptData) {
  const [{ jsPDF }, logo] = await Promise.all([import("jspdf"), loadLogo()]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const left = 50;
  const right = width - 50;

  // Header band
  doc.setFillColor(...DARK);
  doc.rect(0, 0, width, 104, "F");
  doc.setFillColor(...RED);
  doc.rect(0, 104, width, 5, "F");
  let drewLogo = false;
  if (logo) {
    try {
      doc.addImage(logo, "PNG", left, 22, 62 * (900 / 377), 62);
      drewLogo = true;
    } catch {
      // Falls back to the name in text below.
    }
  }
  if (!drewLogo) {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Parilyahan Sa Kalye", left, 62);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Home cooked Filipino streetfoods", right, 56, { align: "right" });
  doc.text("Dubai", right, 70, { align: "right" });

  // Title with a tick
  let y = 165;
  doc.setFillColor(...GREEN);
  doc.circle(left + 14, y - 8, 14, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2.5);
  doc.line(left + 7, y - 8, left + 12, y - 3);
  doc.line(left + 12, y - 3, left + 21, y - 14);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Reservation confirmed", left + 40, y);

  y += 38;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text("BOOKING REFERENCE", left, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...RED);
  doc.text(bookingReference(data.id), left, y + 22);

  // Booking details
  y += 52;
  const rows: [string, string][] = [
    ["Name", data.name],
    ["Date", longDate(data.date)],
    ["Time", formatTimeLabel(data.time)],
    ["Guests", String(data.party_size)],
    ["Phone", data.phone],
  ];
  if (data.notes && data.notes.trim()) rows.push(["Notes", data.notes.trim()]);

  const valueX = left + 110;
  const lines = rows.map(([, value]) => doc.splitTextToSize(value, right - valueX - 16) as string[]);
  const boxHeight = lines.reduce((sum, l) => sum + 14 * l.length + 16, 0) + 14;
  doc.setFillColor(247, 244, 240);
  doc.roundedRect(left, y, right - left, boxHeight, 8, 8, "F");

  let rowY = y + 28;
  rows.forEach(([label], i) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GREY);
    doc.text(label, left + 16, rowY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text(lines[i], valueX, rowY);
    rowY += 14 * lines[i].length + 16;
  });
  y += boxHeight + 34;

  function section(title: string, body: string[]) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...RED);
    doc.text(title, left, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    body.forEach((line) => {
      doc.text(line, left, y);
      y += 16;
    });
    y += 14;
  }

  section("The buffet", [
    `Monday to Thursday: AED ${WEEKDAY_PRICE} + taxes per person`,
    `Friday to Sunday: AED ${WEEKEND_PRICE} + taxes per person, with a free bucket of seafood`,
    `Open daily ${OPEN_HOURS}  |  Halal certified  |  Free parking`,
  ]);
  section("Find us", ADDRESS_LINES.slice(1).concat(`Call or WhatsApp: ${PHONE_DISPLAY}`));

  // Footer
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(left, 770, right, 770);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("To change or cancel your reservation, please call or WhatsApp us and quote your booking reference.", left, 788);
  doc.text("parilyahansakalye.ae", left, 802);
  if (data.created_at) {
    const booked = new Date(data.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dubai" });
    doc.text(`Booked on ${booked} (Dubai time)`, right, 802, { align: "right" });
  }

  return doc;
}
