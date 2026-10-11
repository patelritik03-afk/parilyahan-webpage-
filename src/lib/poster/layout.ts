import { CARD_INNER_H, COLUMN_W } from "./constants";

export type PosterGroup = { category: string; dishes: string[] };
export type Measure = (text: string, size: number, font: "medium" | "extrabold") => number;
export type MenuLayout = { fontSize: number; columns: [PosterGroup[], PosterGroup[]]; fits: boolean };

// Shared with the template so the estimate and the drawing use the same numbers.
export const DISH_LINE = 1.28;
export const HEAD_SCALE = 1.45;
export const HEAD_LINE = 1.2;
const MAX_FONT = 22;
const MIN_FONT = 11;

export const dishGap = (f: number) => Math.round(f * 0.42);
export const groupGap = (f: number) => Math.round(f * 1.1);
export const headPadBottom = (f: number) => Math.round(f * 0.25);
export const headMarginBottom = (f: number) => Math.round(f * 0.55);
export const headSize = (f: number) => Math.round(f * HEAD_SCALE);
export const HEAD_RULE = 2;

function countLines(text: string, f: number, measure: Measure, font: "medium" | "extrabold" = "medium") {
  const space = measure(" ", f, font);
  let lines = 1;
  let width = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const w = measure(word, f, font);
    // A single word wider than the column is broken across lines by the renderer.
    const extra = Math.max(0, Math.ceil(w / COLUMN_W) - 1);
    if (width > 0 && width + space + w > COLUMN_W) {
      lines += 1 + extra;
      width = w - extra * COLUMN_W;
    } else {
      width += (width > 0 ? space : 0) + w;
      lines += extra;
      if (extra) width = w - extra * COLUMN_W;
    }
  }
  return lines;
}

function groupHeight(group: PosterGroup, f: number, measure: Measure) {
  // Long section names ("International Main Course") wrap onto a second line.
  const headLines = countLines(group.category, headSize(f), measure, "extrabold");
  const head = headLines * headSize(f) * HEAD_LINE + headPadBottom(f) + HEAD_RULE + headMarginBottom(f);
  const dishes = group.dishes.reduce(
    (sum, dish) => sum + countLines(dish, f, measure) * f * DISH_LINE + dishGap(f),
    0
  );
  return head + dishes;
}

function columnHeight(heights: number[], from: number, to: number, gap: number) {
  if (to <= from) return 0;
  return heights.slice(from, to).reduce((a, b) => a + b, 0) + gap * (to - from - 1);
}

// Chooses the largest text size at which the menu fits the card, and splits the sections
// into a left and right column (in reading order) with the most even heights.
export function layoutMenu(groups: PosterGroup[], measure: Measure): MenuLayout {
  const limit = CARD_INNER_H * 0.975;
  let result: MenuLayout | null = null;

  for (let f = MAX_FONT; f >= MIN_FONT; f--) {
    const heights = groups.map((g) => groupHeight(g, f, measure));
    const gap = groupGap(f);
    const from = groups.length > 1 ? 1 : 0;
    const to = groups.length > 1 ? groups.length - 1 : 0;

    let bestSplit = groups.length;
    let bestMax = Infinity;
    for (let k = from; k <= Math.max(to, from); k++) {
      const max = Math.max(columnHeight(heights, 0, k, gap), columnHeight(heights, k, groups.length, gap));
      if (max < bestMax) {
        bestMax = max;
        bestSplit = k;
      }
    }

    result = {
      fontSize: f,
      columns: [groups.slice(0, bestSplit), groups.slice(bestSplit)],
      fits: bestMax <= limit,
    };
    if (result.fits) return result;
  }
  return result ?? { fontSize: MIN_FONT, columns: [[], []], fits: true };
}
