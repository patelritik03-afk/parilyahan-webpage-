// PDFs built in the browser (jsPDF), like the reservation reports.
import { formatOrderNumber, shortDate } from "./ops";

const RED: [number, number, number] = [193, 18, 31];

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/brand/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function header(title: string, subtitle: string) {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([import("jspdf"), import("jspdf-autotable"), loadLogo()]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(23, 19, 17);
  doc.rect(0, 0, width, 84, "F");
  if (logo) {
    try {
      doc.addImage(logo, "PNG", 40, 14, 56 * (900 / 377), 56, undefined, "FAST");
    } catch {
      // logo is optional
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, width - 40, 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, width - 40, 60, { align: "right" });
  doc.setTextColor(30, 30, 30);
  return { doc, autoTable, width };
}

export type OrderPdfData = {
  number: number;
  status: string;
  created_at: string;
  created_by_name: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  needed_by: string | null;
  notes: string | null;
  supplier: { name: string; contact_name: string | null; phone: string | null; email: string | null } | null;
  lines: { name: string; detail: string; qty: number; unit: string; note: string | null }[];
};

export async function downloadOrderPdf(order: OrderPdfData, statusLabel: string) {
  const { doc, autoTable, width } = await header(`Purchase order ${formatOrderNumber(order.number)}`, statusLabel);
  const at = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }) : "-";
  const left: [string, string][] = [
    ["Supplier", order.supplier?.name ?? "-"],
    ["Contact", [order.supplier?.contact_name, order.supplier?.phone].filter(Boolean).join(" - ") || "-"],
    ["Needed by", order.needed_by ? shortDate(order.needed_by) : "-"],
  ];
  const right: [string, string][] = [
    ["Created by", `${order.created_by_name ?? "-"}, ${at(order.created_at)}`],
    ["Approved by", order.approved_by_name ? `${order.approved_by_name}, ${at(order.approved_at)}` : "Not approved yet"],
    ["Restaurant", "Parilyahan Sa Kalye"],
  ];
  let y = 112;
  doc.setFontSize(10);
  left.forEach(([k, v], i) => {
    doc.setFont("helvetica", "bold");
    doc.text(k, 40, y + i * 16);
    doc.setFont("helvetica", "normal");
    doc.text(v, 110, y + i * 16);
  });
  right.forEach(([k, v], i) => {
    doc.setFont("helvetica", "bold");
    doc.text(k, width / 2 + 10, y + i * 16);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(v, width / 2 - 120)[0], width / 2 + 90, y + i * 16);
  });
  y += 3 * 16 + 14;
  autoTable(doc, {
    startY: y,
    head: [["#", "Item", "Quantity", "Unit", "Note"]],
    body: order.lines.map((l, i) => [String(i + 1), l.detail ? `${l.name}\n${l.detail}` : l.name, String(l.qty), l.unit, l.note ?? ""]),
    headStyles: { fillColor: RED },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { cellWidth: 26 }, 2: { halign: "right", cellWidth: 70 }, 3: { cellWidth: 60 } },
  });
  if (order.notes) {
    const end = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 40, end);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(order.notes, width - 80), 40, end + 14);
  }
  doc.save(`${formatOrderNumber(order.number)}.pdf`);
}

export async function downloadCountSheet(
  title: string,
  lines: { name: string; category: string; base_unit: string; system_qty: number; counted_qty: number | null }[],
  showSystem: boolean
) {
  const { doc, autoTable } = await header("Stock check sheet", title);
  autoTable(doc, {
    startY: 104,
    head: [showSystem ? ["Item", "Category", "Unit", "System", "Counted"] : ["Item", "Category", "Unit", "Counted"]],
    body: lines.map((l) => {
      const counted = l.counted_qty === null ? "" : String(l.counted_qty);
      return showSystem ? [l.name, l.category, l.base_unit, String(l.system_qty), counted] : [l.name, l.category, l.base_unit, counted];
    }),
    headStyles: { fillColor: RED },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: showSystem ? { 3: { halign: "right" }, 4: { cellWidth: 80 } } : { 3: { cellWidth: 90 } },
  });
  doc.save(`stock-check-${title.replace(/[^\w-]+/g, "-")}.pdf`);
}
