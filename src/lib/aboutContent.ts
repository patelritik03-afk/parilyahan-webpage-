import type { Lang } from "./i18n/translations";

export type AboutText = { title: string; paragraphs: string[] };
export type AboutOverride = Partial<Record<Lang, AboutText>>;

export const ABOUT_SETTING_KEY = "about_content";
export const ABOUT_LIMITS = { title: 120, paragraph: 1500, paragraphs: 8 };

export function cleanAboutText(input: unknown): AboutText | null {
  if (!input || typeof input !== "object") return null;
  const { title, paragraphs } = input as { title?: unknown; paragraphs?: unknown };
  if (typeof title !== "string" || !Array.isArray(paragraphs)) return null;
  const clean = paragraphs
    .filter((p): p is string => typeof p === "string")
    .map((p) => p.trim().slice(0, ABOUT_LIMITS.paragraph))
    .filter(Boolean)
    .slice(0, ABOUT_LIMITS.paragraphs);
  const cleanTitle = title.trim().slice(0, ABOUT_LIMITS.title);
  if (!cleanTitle || clean.length === 0) return null;
  return { title: cleanTitle, paragraphs: clean };
}
