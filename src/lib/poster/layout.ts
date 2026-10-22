export type PosterGroup = { category: string; dishes: string[] };
export type Measure = (text: string, size: number, font: "medium" | "extrabold") => number;
export type MenuLayout = {
  fontSize: number;
  columns: PosterGroup[][];
  columnWidth: number;
  fits: boolean;
};

// Shared with the template so the estimate and the drawing use the same numbers.
export const COLUMN_GAP = 28;
export const DISH_LINE = 1.28;
export const HEAD_LINE = 1.15;
export const HEAD_BAR_W = 34;
export const HEAD_BAR_H = 4;
const MAX_FONT = 27;
const MIN_FONT = 12;

export const headSize = (f: number) => Math.round(f * 1.3);
export const dishGap = (f: number) => Math.round(f * 0.34);
export const groupGap = (f: number) => Math.round(f * 1.05);
export const headBarGap = (f: number) => Math.round(f * 0.22);
export const headMarginBottom = (f: number) => Math.round(f * 0.5);

function countLines(text: string, f: number, width: number, measure: Measure, font: "medium" | "extrabold" = "medium") {
  const space = measure(" ", f, font);
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const w = measure(word, f, font);
    // A single word wider than the column is broken across lines by the renderer.
    const extra = Math.max(0, Math.ceil(w / width) - 1);
    if (used > 0 && used + space + w > width) {
      lines += 1 + extra;
      used = w - extra * width;
    } else {
      used += (used > 0 ? space : 0) + w;
      lines += extra;
      if (extra) used = w - extra * width;
    }
  }
  return lines;
}

function groupHeight(group: PosterGroup, f: number, width: number, measure: Measure) {
  // Long section names ("International Main Course") wrap onto a second line.
  const hs = headSize(f);
  const head =
    countLines(group.category, hs, width, measure, "extrabold") * hs * HEAD_LINE +
    headBarGap(f) +
    HEAD_BAR_H +
    headMarginBottom(f);
  const dishes = group.dishes.reduce((sum, dish) => sum + countLines(dish, f, width, measure) * f * DISH_LINE + dishGap(f), 0);
  return head + dishes;
}

// Splits the sections, in reading order, into `count` columns with the most even heights.
function splitColumns(heights: number[], count: number, gap: number) {
  const span = (from: number, to: number) =>
    to <= from ? 0 : heights.slice(from, to).reduce((a, b) => a + b, 0) + gap * (to - from - 1);
  let best = { max: Infinity, cuts: [] as number[] };
  const search = (start: number, left: number, cuts: number[], max: number) => {
    if (max >= best.max) return;
    if (left === 1) {
      const total = Math.max(max, span(start, heights.length));
      if (total < best.max) best = { max: total, cuts };
      return;
    }
    for (let end = start + 1; end <= heights.length - left + 1; end++) {
      search(end, left - 1, [...cuts, end], Math.max(max, span(start, end)));
    }
  };
  search(0, count, [], 0);
  return best;
}

// Chooses the largest text size at which the menu fits, trying two and then three columns at each size.
export function layoutMenu(groups: PosterGroup[], measure: Measure, box: { width: number; height: number }): MenuLayout {
  const limit = box.height * 0.985;
  let fallback: MenuLayout | null = null;

  for (let f = MAX_FONT; f >= MIN_FONT; f--) {
    for (const wanted of [2, 3]) {
      const count = Math.max(1, Math.min(wanted, groups.length));
      const width = (box.width - COLUMN_GAP * (count - 1)) / count;
      const heights = groups.map((g) => groupHeight(g, f, width, measure));
      const { max, cuts } = splitColumns(heights, count, groupGap(f));
      const bounds = [0, ...cuts, groups.length];
      const layout: MenuLayout = {
        fontSize: f,
        columns: bounds.slice(0, -1).map((from, i) => groups.slice(from, bounds[i + 1])),
        columnWidth: width,
        fits: max <= limit,
      };
      if (layout.fits) return layout;
      if (count === 3 || count === groups.length) fallback = layout;
    }
  }
  return fallback ?? { fontSize: MIN_FONT, columns: [], columnWidth: box.width, fits: true };
}
