import "server-only";
import ExcelJS from "exceljs";
import type { MenuItem } from "./types";

export type ImportedMenu = { date: string; items: MenuItem[]; source: string };
export type ImportResult = { menus: ImportedMenu[]; warnings: string[] };

type Grid = { text: string; date: string | null }[][];

const WEEKDAY_RE = /^(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|sday|nesday|rsday|urday)?$/i;
const NOISE_RE = /replace the menu|make it in/i;
const MAX_ROWS = 400;
const MAX_COLS = 40;

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cellToText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((r) => r.text).join("");
    if ("result" in value && value.result !== undefined) return cellToText(value.result as ExcelJS.CellValue);
    if ("text" in value) return String(value.text);
    return "";
  }
  return String(value);
}

function toIsoDate(y: number, m: number, d: number): string | null {
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseDateText(text: string): string | null {
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return toIsoDate(+iso[1], +iso[2], +iso[3]);
  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) return toIsoDate(+dmy[3], +dmy[2], +dmy[1]);
  return null;
}

function toGridCell(text: string) {
  const cleaned = cleanText(text);
  return { text: cleaned, date: cleaned ? parseDateText(cleaned) : null };
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const text = input.replace(/^﻿/, "");

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toGrid(rows: string[][]): Grid {
  return rows.slice(0, MAX_ROWS).map((row) => row.slice(0, MAX_COLS).map(toGridCell));
}

function isNonDishCell(text: string) {
  return WEEKDAY_RE.test(text) || NOISE_RE.test(text);
}

// Flat layout: columns Date | Category | Dish | Description (optional)
function parseFlatSheet(name: string, grid: Grid): ImportedMenu[] | null {
  const headerIdx = grid.findIndex((row) => {
    const labels = row.map((c) => c.text.toLowerCase());
    return (
      labels.includes("date") &&
      labels.some((l) => /^(category|section|header)$/.test(l)) &&
      labels.some((l) => /^(dish|item|name|menu item)$/.test(l))
    );
  });
  if (headerIdx === -1) return null;

  const labels = grid[headerIdx].map((c) => c.text.toLowerCase());
  const dateCol = labels.indexOf("date");
  const catCol = labels.findIndex((l) => /^(category|section|header)$/.test(l));
  const dishCol = labels.findIndex((l) => /^(dish|item|name|menu item)$/.test(l));
  const descCol = labels.indexOf("description");

  const byDate = new Map<string, MenuItem[]>();
  for (const row of grid.slice(headerIdx + 1)) {
    const date = row[dateCol]?.date;
    const category = row[catCol]?.text;
    const dish = row[dishCol]?.text;
    if (!date || !category || !dish) continue;
    const items = byDate.get(date) ?? [];
    items.push({
      category: category.slice(0, 100),
      name: dish.slice(0, 200),
      description: descCol >= 0 ? (row[descCol]?.text ?? "").slice(0, 500) : "",
    });
    byDate.set(date, items);
  }
  return [...byDate.entries()].map(([date, items]) => ({ date, items, source: name }));
}

// A run of 2+ filled cells = heading followed by dishes. A lone cell is a dish under the previous heading.
function columnToItems(cells: string[]): MenuItem[] {
  const items: MenuItem[] = [];
  let category = "";
  let i = 0;
  while (i < cells.length) {
    if (!cells[i]) {
      i++;
      continue;
    }
    const block: string[] = [];
    while (i < cells.length && cells[i]) block.push(cells[i++]);

    if (block.length >= 2) {
      category = block[0].replace(/:$/, "").replace(/\s*\([^)]*\)$/, "").slice(0, 100);
      for (const dish of block.slice(1)) items.push({ category, name: dish.slice(0, 200), description: "" });
    } else if (category) {
      items.push({ category, name: block[0].slice(0, 200), description: "" });
    }
  }
  return items;
}

// Row labels (Starter, Salad, Chicken...) sit in the column left of the dates, one per row.
function labelColumnToItems(cells: string[], labels: string[]): MenuItem[] {
  const items: MenuItem[] = [];
  cells.forEach((dish, r) => {
    const category = labels[r];
    if (dish && category) items.push({ category: category.slice(0, 100), name: dish.slice(0, 200), description: "" });
  });
  return items;
}

function hasRowLabels(grid: Grid, rows: number[], labelCol: number, dateCols: number[]) {
  if (labelCol < 0) return false;
  const filledRows = rows.filter((r) => dateCols.some((c) => grid[r][c]?.text));
  const labels = filledRows.map((r) => grid[r][labelCol]?.text ?? "").filter(Boolean);
  if (filledRows.length === 0 || labels.length < filledRows.length * 0.6) return false;
  return new Set(labels).size >= labels.length * 0.7;
}

// Calendar layout: dates across the top, headings + dishes stacked under each date column.
function parseGridSheet(name: string, grid: Grid): ImportedMenu[] {
  const dateRows = grid.flatMap((row, r) => (row.some((c) => c.date) ? [r] : []));
  const menus: ImportedMenu[] = [];

  dateRows.forEach((start, k) => {
    const end = dateRows[k + 1] ?? grid.length;
    const dateCols = grid[start].flatMap((c, col) => (c.date ? [col] : []));
    const bodyRows = Array.from({ length: end - start - 1 }, (_, i) => start + 1 + i);
    const labelCol = dateCols[0] - 1;
    const labelMode = hasRowLabels(grid, bodyRows, labelCol, dateCols);
    const labels = bodyRows.map((r) => grid[r][labelCol]?.text ?? "");

    for (const col of dateCols) {
      const cells = bodyRows.map((r) => {
        const text = grid[r][col]?.text ?? "";
        return isNonDishCell(text) ? "" : text;
      });
      const items = labelMode ? labelColumnToItems(cells, labels) : columnToItems(cells);
      if (items.length) menus.push({ date: grid[start][col].date!, items, source: name });
    }
  });

  return menus;
}

export async function parseMenuFile(fileName: string, data: Buffer): Promise<ImportResult> {
  const sheets: { name: string; grid: Grid }[] = [];

  if (/\.csv$/i.test(fileName)) {
    sheets.push({ name: fileName, grid: toGrid(parseCsv(data.toString("utf8"))) });
  } else {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data as unknown as ArrayBuffer);
    for (const ws of workbook.worksheets) {
      const rows: string[][] = [];
      const rowCount = Math.min(ws.rowCount, MAX_ROWS);
      const colCount = Math.min(ws.columnCount, MAX_COLS);
      for (let r = 1; r <= rowCount; r++) {
        const row = ws.getRow(r);
        rows.push(Array.from({ length: colCount }, (_, c) => cellToText(row.getCell(c + 1).value)));
      }
      sheets.push({ name: ws.name.trim(), grid: toGrid(rows) });
    }
  }

  const found = new Map<string, ImportedMenu>();
  let duplicates = 0;
  for (const sheet of sheets) {
    const menus = parseFlatSheet(sheet.name, sheet.grid) ?? parseGridSheet(sheet.name, sheet.grid);
    for (const menu of menus) {
      const existing = found.get(menu.date);
      if (existing) duplicates++;
      if (!existing || menu.items.length > existing.items.length) found.set(menu.date, menu);
    }
  }

  const warnings: string[] = [];
  if (duplicates > 0) {
    warnings.push(`${duplicates} date(s) appeared more than once in the file - the version with more dishes was kept.`);
  }
  if (found.size === 0) {
    warnings.push("No menus found. Make sure each menu day has a date (like 2026-09-18) above its dishes.");
  }

  const menus = [...found.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { menus, warnings };
}
