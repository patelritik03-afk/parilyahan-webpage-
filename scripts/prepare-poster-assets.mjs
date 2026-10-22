// Prepares the fixed pictures used by the daily menu poster (run: node scripts/prepare-poster-assets.mjs).
// Sources are the restaurant's own photos in scripts/poster-source; the output in src/assets/poster
// is committed, so this only needs re-running if the pictures change. Sizes must match src/lib/poster/constants.ts.
import sharp from "sharp";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "src/assets/poster");
const src = (name) => path.join(root, "scripts/poster-source", name);

const HERO_W = 1080;
const HERO_H = 640;
const BADGE = 168;

// Weekdays: street-food barbecue skewers. Weekends: crab from the seafood bucket.
await sharp(src("bbq-skewers.jpg"))
  .resize(HERO_W, HERO_H, { fit: "cover", position: "centre" })
  .modulate({ saturation: 1.08 })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(path.join(out, "hero-weekday.jpg"));

await sharp(src("crab-bucket-sauce.jpg"))
  .resize(HERO_W, HERO_H, { fit: "cover", position: "centre" })
  .modulate({ saturation: 1.08 })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(path.join(out, "hero-weekend.jpg"));

// Round picture on the "free bucket seafoods" banner.
await sharp(src("seafood-buckets.jpg"))
  .resize(BADGE, BADGE, { fit: "cover", position: "attention" })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(path.join(out, "bucket-badge.jpg"));

// The site logo already has light lettering, which suits the dark top of the photo.
await sharp(path.join(root, "public/brand/logo.png"))
  .resize({ width: 640 })
  .png({ compressionLevel: 9 })
  .toFile(path.join(out, "logo-light.png"));

console.log("poster assets written to", out);
