// Prepares the fixed artwork used by the daily menu poster (run: node scripts/prepare-poster-assets.mjs).
// Output goes to src/assets/poster and is committed, so this only needs re-running if the pictures change.
import sharp from "sharp";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "src/assets/poster");
const src = (name) => path.join(out, "source", `${name}.jpg`);

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

// Mosaic of AI-generated Filipino food pictures (see source/). Two columns of 208px, matching the 200px
// source pictures so nothing is stretched much. Widths/heights must match src/lib/poster/constants.ts.
// The weekend poster has a "free bucket seafoods" banner, so its collage is shorter than the weekday one.
const COLLAGE_W = 424;
const GAP = 8;
const CELL_W = (COLLAGE_W - GAP) / 2;
const WIDE_H = 130;

async function buildCollage(file, totalH, rows) {
  const squareRows = rows.length;
  const squareH = (totalH - WIDE_H - squareRows * GAP) / squareRows;
  const heights = [WIDE_H, ...rows.map((_, i) => Math.floor(squareH) + (i < Math.round((squareH % 1) * squareRows) ? 1 : 0))];
  const layers = [];
  let y = 0;
  const grid = [["feast-wide", "seafood-wide"], ...rows];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < 2; c++) {
      const input = await sharp(src(grid[r][c]))
        .resize(CELL_W, heights[r], { fit: "cover", position: "centre", kernel: "lanczos3" })
        .sharpen({ sigma: 0.6 })
        .toBuffer();
      layers.push({ input, left: c * (CELL_W + GAP), top: y });
    }
    y += heights[r] + GAP;
  }
  await sharp({ create: { width: COLLAGE_W, height: totalH, channels: 3, background: "#ffffff" } })
    .composite(layers)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(out, file));
}

await buildCollage("collage-weekend.jpg", 840, [
  ["kare-kare", "inasal-bbq"],
  ["lechon", "sisig"],
  ["pancit-lumpia", "halo-halo"],
]);
await buildCollage("collage-weekday.jpg", 956, [
  ["kare-kare", "inasal-bbq"],
  ["lechon", "sisig"],
  ["chicken-adobo", "sinigang"],
  ["pancit-lumpia", "halo-halo"],
]);
console.log("poster assets written to", out);
