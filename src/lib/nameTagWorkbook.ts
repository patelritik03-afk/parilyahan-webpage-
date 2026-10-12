import "server-only";
import ExcelJS from "exceljs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { TAGS_PER_PAGE, chunkTags, tagFontPt } from "./nameTags";

// Same layout as the NAME TAG IBIS sheet: two tag boxes per row, five rows per A4 page, logo at the top of each
// box and the dish name in Cinzel Black capitals. Each page of 10 tags is its own sheet, ready to print.
const TAG_COL_WIDTH = 65.5; // Excel character units
const GAP_COL_WIDTH = 1.71;
const TAG_ROW_HEIGHT = 200.25; // points
const GAP_ROW_HEIGHT = 34.5;
const LOGO_W_PX = 132;
const LOGO_H_PX = 90;
const COL_PX = Math.trunc(TAG_COL_WIDTH * 7 + 5); // Excel's pixel width for a column
const ROW_PX = (TAG_ROW_HEIGHT * 96) / 72;

export async function buildNameTagWorkbook(tags: string[]): Promise<ArrayBuffer> {
  const logo = await readFile(join(process.cwd(), "src/assets/nametag/ibis-styles.jpeg"));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Parilyahan Sa Kalye";
  const imageId = workbook.addImage({ buffer: logo as unknown as ExcelJS.Buffer, extension: "jpeg" });

  chunkTags(tags).forEach((pageTags, pageIndex) => {
    const sheet = workbook.addWorksheet(`Page ${pageIndex + 1}`, { views: [{ showGridLines: false }] });
    sheet.getColumn(1).width = TAG_COL_WIDTH;
    sheet.getColumn(2).width = GAP_COL_WIDTH;
    sheet.getColumn(3).width = TAG_COL_WIDTH;
    for (let row = 1; row <= TAGS_PER_PAGE - 1; row++) {
      sheet.getRow(row).height = row % 2 === 1 ? TAG_ROW_HEIGHT : GAP_ROW_HEIGHT;
    }

    pageTags.forEach((text, slot) => {
      const row = Math.floor(slot / 2) * 2 + 1;
      const col = slot % 2 === 0 ? 1 : 3;
      const cell = sheet.getCell(row, col);
      const name = text.toUpperCase();
      cell.value = name;
      cell.font = { name: "Cinzel Black", bold: true, size: tagFontPt(name) };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      const edge = { style: "medium" as const, color: { argb: "FF000000" } };
      cell.border = { top: edge, left: edge, bottom: edge, right: edge };

      sheet.addImage(imageId, {
        tl: { col: col - 1 + (COL_PX - LOGO_W_PX) / 2 / COL_PX, row: row - 1 + 6 / ROW_PX },
        ext: { width: LOGO_W_PX, height: LOGO_H_PX },
        editAs: "oneCell",
      });
    });

    sheet.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
      printArea: "A1:C9",
    };
  });

  return workbook.xlsx.writeBuffer();
}
