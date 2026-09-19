// One-off asset pipeline: node scripts/prepare-photos.mjs <photos-folder> <hero-1.jpg> <hero-2.jpg>
// Dedupes dish photos by pixel similarity, names them, writes optimised webp files to public/,
// generates src/lib/galleryData.ts, and prepares the logo, favicon and hero backgrounds.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [srcRoot, hero1, hero2] = process.argv.slice(2);
const OUT_GALLERY = "public/gallery";
const THRESHOLD = 8;

const NAME_FIXES = {
  BISTEK: "Bistek",
  "Ginataang Lanka": "Ginataang Langka",
  "Pritiong Tilapia": "Pritong Tilapia",
  "Kaldaretang Baka": "Kalderetang Baka",
  "Grilled BBQ Chicken": "Grilled Chicken BBQ Stick",
  "Grilled Proved": "Grilled Proven",
  "grilled beef isaw": "Grilled Beef Isaw",
  "Sinigang Na": "Sinigang na Hipon",
  "Sinigang sa Salmon Head": "Sinigang na Salmon Head",
  "Beef Siomai": "Chicken Siomai",
  "Sinampalukan (2)": "Sinampalukan",
  Shanghai: "Lumpiang Shanghai",
  Gizzard: "Chicken Gizzard",
};

const COMBO_NAMES = {
  "BBMBAP Chicken beef": "Bibimbap Chicken & Beef",
  "BUSOG LUSOG": "Busog Lusog",
  "Chicken Teriyaki and Chicken BBQ": "Chicken Teriyaki and Chicken BBQ",
  "DAYUHAN SA IHAWAN SALO SALO": "Dayuhan sa Ihawan Salo-Salo",
  "Ihaw Ihawan": "Ihaw-Ihawan",
  "PROBINSYANG CHARAP": "Probinsyang Charap",
};

const SMALL_WORDS = new Set(["na", "ng", "sa", "at", "with"]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );
}

function slugify(name) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function nameFromStudioFile(file) {
  const base = path.basename(file, path.extname(file));
  const raw = base.replace(/^ParilyahanSaKalye_/, "").replace(/_Subham.*$/, "");
  const spaced = raw
    .replace(/(\d+)(G|g|Stick)\b/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return spaced
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

async function thumb(file) {
  const { data } = await sharp(file).resize(48, 32, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return data;
}

function mad(a, b) {
  let sum = 0;
  let n = 0;
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 48; x++) {
      if (y >= 24 && x < 20) continue; // ignore bottom-left corner where watermarks sit
      for (let c = 0; c < 3; c++) {
        const i = (y * 48 + x) * 3 + c;
        sum += Math.abs(a[i] - b[i]);
        n++;
      }
    }
  return sum / n;
}

async function writeWebp(file, outPath, maxWidth) {
  const info = await sharp(file)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outPath);
  return { w: info.width, h: info.height };
}

async function makeLogo() {
  const logoFile = walk(srcRoot).find((f) => /logo/i.test(path.basename(f)));
  const trimmed = await sharp(logoFile).trim({ background: "#000000", threshold: 25 }).png().toBuffer();
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Fade the black background to transparent, leaving the logo colours untouched.
  for (let i = 0; i < data.length; i += 4) {
    const brightest = Math.max(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.max(0, Math.min(255, Math.round(((brightest - 10) / 50) * 255)));
  }
  fs.mkdirSync("public/brand", { recursive: true });
  const logo = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize({ width: 900 })
    .png({ compressionLevel: 9 })
    .toFile("public/brand/logo.png");
  const heart = await sharp("public/brand/logo.png")
    .extract({ left: 242, top: 0, width: 300, height: 190 })
    .flatten({ background: "#0d0c0b" })
    .extend({ top: 55, bottom: 55, background: "#0d0c0b" })
    .png()
    .toBuffer();
  await sharp(heart).resize(256, 256).png().toFile("src/app/icon.png");
  console.log("logo", logo.width, "x", logo.height);
}

async function makeHeroes() {
  fs.mkdirSync("public/images", { recursive: true });
  await writeWebp(hero1, "public/images/hero-atrium.webp", 2000);
  await writeWebp(hero2, "public/images/hero-buffet.webp", 2000);
}

async function main() {
  fs.rmSync(OUT_GALLERY, { recursive: true, force: true });
  fs.mkdirSync(OUT_GALLERY, { recursive: true });

  const files = walk(srcRoot).filter((f) => /\.(jpe?g|png)$/i.test(f) && !/logo/i.test(path.basename(f)));
  const combos = files.filter((f) => /Combo meal/i.test(f));
  const dishes = files.filter((f) => !/Combo meal/i.test(f));

  const items = [];
  for (const f of dishes) {
    const meta = await sharp(f).metadata();
    items.push({ f, w: meta.width, t: await thumb(f), inComp: /comp no trademark/i.test(f) });
  }

  const parent = items.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) if (mad(items[i].t, items[j].t) <= THRESHOLD) parent[find(i)] = find(j);

  const clusters = new Map();
  items.forEach((it, i) => clusters.set(find(i), [...(clusters.get(find(i)) ?? []), it]));

  const gallery = [];
  const usedSlugs = new Set();
  const uniqueSlug = (name) => {
    let slug = slugify(name);
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(name)}-${n}`;
    usedSlugs.add(slug);
    return slug;
  };

  for (const members of clusters.values()) {
    const pool = members.some((m) => m.inComp) ? members.filter((m) => m.inComp) : members;
    const best = pool.reduce((a, b) => (b.w > a.w ? b : a));

    const pngNames = members
      .map((m) => path.basename(m.f, path.extname(m.f)).trim())
      .filter((n) => !/^ParilyahanSaKalye_/.test(n) && !/^\d+$/.test(n))
      .map((n) => NAME_FIXES[n] ?? n)
      .map((n) => n.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(Na|Ng|Sa)\b/g, (w) => w.toLowerCase()));
    const studioFile = members.find((m) => /ParilyahanSaKalye_/.test(m.f));
    const name = pngNames[0] ?? (studioFile ? nameFromStudioFile(studioFile.f) : null);

    const slug = uniqueSlug(name ?? "photo");
    const { w, h } = await writeWebp(best.f, path.join(OUT_GALLERY, `${slug}.webp`), 1200);
    gallery.push({ src: `/gallery/${slug}.webp`, name, w, h, group: "dish" });
  }

  for (const f of combos) {
    const base = path.basename(f, path.extname(f));
    const name = COMBO_NAMES[base] ?? base;
    const slug = uniqueSlug(name);
    const { w, h } = await writeWebp(f, path.join(OUT_GALLERY, `${slug}.webp`), 1400);
    gallery.push({ src: `/gallery/${slug}.webp`, name, w, h, group: "combo" });
  }

  gallery.sort((a, b) => {
    if (a.group !== b.group) return a.group === "combo" ? -1 : 1;
    if (!a.name !== !b.name) return a.name ? -1 : 1;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  const ts = `export type StaticGalleryItem = {
  src: string;
  name: string | null;
  w: number;
  h: number;
  group: "combo" | "dish";
};

export const STATIC_GALLERY: StaticGalleryItem[] = ${JSON.stringify(gallery, null, 2)};
`;
  fs.writeFileSync("src/lib/galleryData.ts", ts);

  await makeLogo();
  await makeHeroes();
  console.log(`source photos: ${files.length}, unique gallery photos: ${gallery.length} (${combos.length} combos)`);
  console.log(gallery.map((g) => g.name ?? "(no name)").join(" | "));
}

await main();
