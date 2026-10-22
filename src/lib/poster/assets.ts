import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as opentype from "opentype.js";
import type { Measure } from "./layout";

type FontKey = "medium" | "semibold" | "extrabold" | "extrabolditalic";

export type PosterAssets = {
  logo: string;
  heroWeekday: string;
  heroWeekend: string;
  bucketBadge: string;
  fonts: { name: string; data: ArrayBuffer; weight: 500 | 600 | 800; style: "normal" | "italic" }[];
  measure: Measure;
  measureFont: (text: string, size: number, font: FontKey) => number;
};

const toArrayBuffer = (buf: Buffer) => new Uint8Array(buf).buffer as ArrayBuffer;
const dataUri = (mime: string, buf: Buffer) => `data:${mime};base64,${buf.toString("base64")}`;

let cached: Promise<PosterAssets> | null = null;

async function load(): Promise<PosterAssets> {
  // Literal paths so the deployment bundles these files (see outputFileTracingIncludes in next.config.ts).
  const [medium, semibold, extrabold, extrabolditalic, logo, heroWeekday, heroWeekend, bucketBadge] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/poster/fonts/Poppins-Medium.ttf")),
    readFile(join(process.cwd(), "src/assets/poster/fonts/Poppins-SemiBold.ttf")),
    readFile(join(process.cwd(), "src/assets/poster/fonts/Poppins-ExtraBold.ttf")),
    readFile(join(process.cwd(), "src/assets/poster/fonts/Poppins-ExtraBoldItalic.ttf")),
    readFile(join(process.cwd(), "src/assets/poster/logo-light.png")),
    readFile(join(process.cwd(), "src/assets/poster/hero-weekday.jpg")),
    readFile(join(process.cwd(), "src/assets/poster/hero-weekend.jpg")),
    readFile(join(process.cwd(), "src/assets/poster/bucket-badge.jpg")),
  ]);

  const parsed: Record<FontKey, opentype.Font> = {
    medium: opentype.parse(toArrayBuffer(medium)),
    semibold: opentype.parse(toArrayBuffer(semibold)),
    extrabold: opentype.parse(toArrayBuffer(extrabold)),
    extrabolditalic: opentype.parse(toArrayBuffer(extrabolditalic)),
  };
  const measureFont = (text: string, size: number, font: FontKey) => parsed[font].getAdvanceWidth(text, size);

  return {
    logo: dataUri("image/png", logo),
    heroWeekday: dataUri("image/jpeg", heroWeekday),
    heroWeekend: dataUri("image/jpeg", heroWeekend),
    bucketBadge: dataUri("image/jpeg", bucketBadge),
    fonts: [
      { name: "Poppins", data: toArrayBuffer(medium), weight: 500, style: "normal" },
      { name: "Poppins", data: toArrayBuffer(semibold), weight: 600, style: "normal" },
      { name: "Poppins", data: toArrayBuffer(extrabold), weight: 800, style: "normal" },
      { name: "Poppins", data: toArrayBuffer(extrabolditalic), weight: 800, style: "italic" },
    ],
    measure: (text, size, font) => measureFont(text, size, font),
    measureFont,
  };
}

export function loadPosterAssets() {
  cached ??= load().catch((err) => {
    cached = null;
    throw err;
  });
  return cached;
}
