import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth";

const SAMPLE_SECTIONS: { title: string; dishes: string[] }[] = [
  { title: "Starter", dishes: ["Sample starter 1", "Sample starter 2"] },
  { title: "Soup", dishes: ["Sample soup"] },
  { title: "Salad", dishes: ["Green Salad", "Sample salad"] },
  { title: "Noodles", dishes: ["Sample noodles"] },
  { title: "Main Course", dishes: ["Sample main 1", "Sample main 2", "Sample main 3"] },
  { title: "Rice", dishes: ["Steamed Rice"] },
  { title: "Special Dish", dishes: ["Sample special dish"] },
  { title: "Dessert", dishes: ["Sample dessert 1", "Sample dessert 2"] },
  { title: "Ice Cream", dishes: ["Soft Ice Cream (Flavored)"] },
  { title: "Drinks", dishes: ["Ice Tea", "Gulaman drinks"] },
];

const DAYS = ["Friday", "Saturday", "Sunday"];

function buildCsv() {
  const lines = ["Date,Category,Dish,Description"];
  for (const day of ["2026-01-02", "2026-01-03"]) {
    for (const section of SAMPLE_SECTIONS) {
      for (const dish of section.dishes) lines.push(`${day},${section.title},${dish},`);
    }
  }
  return lines.join("\r\n") + "\r\n";
}

async function buildXlsx() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Menu");
  sheet.getColumn(1).width = 8;
  [2, 3, 4].forEach((c) => (sheet.getColumn(c).width = 34));

  DAYS.forEach((day, i) => {
    const col = i + 2;
    const dateCell = sheet.getCell(3, col);
    dateCell.value = new Date(Date.UTC(2026, 0, 2 + i));
    dateCell.numFmt = "yyyy-mm-dd";
    dateCell.font = { bold: true };
    sheet.getCell(4, col).value = day;

    let row = 6;
    for (const section of SAMPLE_SECTIONS) {
      const head = sheet.getCell(row, col);
      head.value = section.title;
      head.font = { bold: true };
      head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE9D9" } };
      section.dishes.forEach((dish, d) => (sheet.getCell(row + 1 + d, col).value = dish));
      row += section.dishes.length + 2;
    }
  });

  const help = workbook.addWorksheet("How to use");
  help.getColumn(1).width = 110;
  [
    "Menu sheet: one column per menu day.",
    "Row 3: the date of each day (format yyyy-mm-dd, e.g. 2026-01-02).",
    "Below it, write a section heading (Starter, Soup, Main Course, Dessert, Drinks, Ice Cream...) then the dishes under it.",
    "Leave one empty row between sections. Repeat for as many days as you like, or add more sheets.",
    "Uploading replaces the menu of any date that already has one.",
  ].forEach((line, i) => (help.getCell(i + 1, 1).value = line));

  return workbook.xlsx.writeBuffer();
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const format = request.nextUrl.searchParams.get("format");

  if (format === "csv") {
    return new Response(buildCsv(), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="menu-template.csv"',
      },
    });
  }

  const buffer = await buildXlsx();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="menu-template.xlsx"',
    },
  });
}
