import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth";
import { findReservations } from "@/lib/reservationsQuery";
import { statusLabel } from "@/lib/reservationStatus";
import { formatTimeLabel } from "@/lib/timeSlots";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const reservations = await findReservations(request.nextUrl.searchParams);
  if (!reservations) return NextResponse.json({ error: "Could not load reservations" }, { status: 500 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reservations", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Date", key: "date", width: 13 },
    { header: "Time", key: "time", width: 10 },
    { header: "Name", key: "name", width: 26 },
    { header: "Guests", key: "party", width: 8 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Email", key: "email", width: 30 },
    { header: "Status", key: "status", width: 12 },
    { header: "Notes", key: "notes", width: 40 },
    { header: "Booked on", key: "created", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of reservations) {
    sheet.addRow({
      date: r.date,
      time: formatTimeLabel(r.time),
      name: r.name,
      party: r.party_size,
      phone: r.phone,
      email: r.email,
      status: statusLabel(r.status),
      notes: r.notes ?? "",
      created: r.created_at.slice(0, 16).replace("T", " "),
    });
  }

  const total = sheet.addRow({ name: "Total", party: reservations.reduce((sum, r) => sum + r.party_size, 0) });
  total.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="reservations.xlsx"',
    },
  });
}
