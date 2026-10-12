import type { MenuItem } from "./types";

export type TagSection = { category: string; tags: string[] };

// Name tags go 2 across and 5 down on one A4 page, like the existing NAME TAG IBIS sheet.
export const TAGS_PER_PAGE = 10;
export const MAX_TAGS = 200;

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

// Removes notes like "(International dishes)" or "(Complementary)" and stray punctuation such as "!!!".
function clean(text: string) {
  return text
    .replace(/\([^)]*\)/g, " ")
    .replace(/[!*]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,.\-–:]+|[\s,.\-–:]+$/g, "")
    .trim();
}

// One menu line can hold several dishes ("A OR B", "A, B", "Creamy Salted Egg/Lemon Butter Seafoods"):
// each gets its own tag. A slash only splits when both sides are real dish names (2+ words), so
// "Kinilawin na Isda/Pugita" stays as one tag.
export function splitDish(raw: string): string[] {
  const parts: string[] = [];
  for (const orPart of raw.split(/\s+or\s+/i)) {
    for (const commaPart of orPart.split(/\s*,\s*/)) {
      const slashParts = commaPart.split(/\s*\/\s*/);
      if (slashParts.length > 1 && slashParts.every((p) => wordCount(clean(p)) >= 2)) parts.push(...slashParts);
      else parts.push(commaPart);
    }
  }
  return parts.map(clean).filter(Boolean);
}

// The day's menu -> one tag per dish, kept in menu order and grouped by section (duplicates dropped).
export function extractTags(items: MenuItem[]): TagSection[] {
  const sections: TagSection[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    for (const name of splitDish(item.name)) {
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      let section = sections.find((s) => s.category === item.category);
      if (!section) {
        section = { category: item.category, tags: [] };
        sections.push(section);
      }
      section.tags.push(name);
    }
  }
  return sections;
}

// Font size in points (as used in the Excel sheet) so long names still fit on the tag.
export function tagFontPt(text: string) {
  const length = text.length;
  if (length <= 16) return 28;
  if (length <= 26) return 26;
  if (length <= 40) return 22;
  return 18;
}

export function chunkTags<T>(tags: T[]): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < tags.length; i += TAGS_PER_PAGE) pages.push(tags.slice(i, i + TAGS_PER_PAGE));
  return pages;
}
