import type { Reservation } from "./types";
import { statusLabel } from "./reservationStatus";
import { formatTimeLabel } from "./timeSlots";

// Builds the PDF in the browser from the rows already on screen, so what you see is what you print.
async function buildPdf(reservations: Reservation[], filterText: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const guests = reservations.reduce((sum, r) => sum + r.party_size, 0);
  const generated = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai" });

  doc.setFontSize(16);
  doc.text("Parilyahan Sa Kalye - Reservations report", 40, 40);
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Filters: ${filterText}`, 40, 58);
  doc.text(`${reservations.length} reservation(s) | ${guests} guests | Generated ${generated} (Dubai time)`, 40, 72);

  autoTable(doc, {
    startY: 86,
    head: [["Date", "Time", "Name", "Guests", "Phone", "Email", "Status", "Notes"]],
    body: reservations.map((r) => [
      r.date,
      formatTimeLabel(r.time),
      r.name,
      String(r.party_size),
      r.phone,
      r.email,
      statusLabel(r.status),
      r.notes ?? "",
    ]),
    foot: [["", "", "Total", String(guests), "", "", "", ""]],
    styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [120, 20, 30] },
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
    columnStyles: { 3: { halign: "center" }, 7: { cellWidth: 170 } },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Page ${doc.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 70, doc.internal.pageSize.getHeight() - 20);
    },
  });
  return doc;
}

export async function downloadReservationsPdf(reservations: Reservation[], filterText: string) {
  const doc = await buildPdf(reservations, filterText);
  doc.save("reservations-report.pdf");
}

// The window is opened first (inside the click) so the browser does not treat it as a blocked pop-up.
export async function printReservationsReport(reservations: Reservation[], filterText: string) {
  const win = window.open("", "_blank");
  const doc = await buildPdf(reservations, filterText);
  doc.autoPrint();
  const url = doc.output("bloburl").toString();
  if (win) win.location.href = url;
  else window.location.href = url;
}
