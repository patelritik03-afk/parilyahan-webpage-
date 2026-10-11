// Prepares the fixed artwork used by the daily menu poster (run: node scripts/prepare-poster-assets.mjs).
// Output goes to src/assets/poster and is committed, so this only needs re-running if the photos change.
import sharp from "sharp";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "src/assets/poster");

// The site logo has light lettering for the dark header; darken the neutral pixels for a white poster.
const { data, info } = await sharp(path.join(root, "public/brand/logo.png"))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  if (!data[i + 3]) continue;
  const max = Math.max(data[i], data[i + 1], data[i + 2]);
  const min = Math.min(data[i], data[i + 1], data[i + 2]);
  if (max - min < 40 && max > 130) data[i] = data[i + 1] = data[i + 2] = 22;
}
await sharp(data, { raw: info }).resize({ width: 760 }).png({ compressionLevel: 9 }).toFile(path.join(out, "logo-dark.png"));

// Food photo mosaic. COLLAGE_W/H must match src/lib/poster/constants.ts.
const COLLAGE_W = 424;
const COLLAGE_H = 840;
const GAP = 8;
const half = (COLLAGE_W - GAP) / 2;
const photo = (name) => path.join(root, "public/gallery", name);
const cells = [
  { file: "busog-lusog.webp", x: 0, y: 0, w: COLLAGE_W, h: 240 },
  { file: "kare-kare.webp", x: 0, y: 248, w: half, h: 230 },
  { file: "grilled-chicken-feet.webp", x: half + GAP, y: 248, w: half, h: 230 },
  { file: "adobong-alimango.webp", x: 0, y: 486, w: half, h: 170 },
  { file: "chicken-inasal.webp", x: half + GAP, y: 486, w: half, h: 170 },
  { file: "lumpiang-shanghai.webp", x: 0, y: 664, w: COLLAGE_W, h: COLLAGE_H - 664 },
];

const layers = await Promise.all(
  cells.map(async (c) => ({
    input: await sharp(photo(c.file)).resize(c.w, c.h, { fit: "cover", position: "attention" }).toBuffer(),
    left: c.x,
    top: c.y,
  }))
);
await sharp({ create: { width: COLLAGE_W, height: COLLAGE_H, channels: 3, background: "#ffffff" } })
  .composite(layers)
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(out, "collage.jpg"));
console.log("poster assets written to", out);
