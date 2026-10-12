import "server-only";
import sharp from "sharp";
import { supabaseAdmin } from "./supabase";

const BUCKET = "site-images";
// Only TikTok's own picture servers are fetched.
const ALLOWED_HOST = /(^|\.)(tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com|tiktokv\.com)$/i;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

// TikTok's own preview pictures are over 1 MB and their links expire, so we keep a small copy
// (about 30 KB) in our own storage. Visitors then see a light preview and only load TikTok's heavy
// player when they tap play. Returns the public address, or null if anything goes wrong.
export async function saveVideoThumbnail(videoId: string, thumbnailUrl: string): Promise<string | null> {
  try {
    if (!/^\d{8,25}$/.test(videoId)) return null;
    const url = new URL(thumbnailUrl);
    if (url.protocol !== "https:" || !ALLOWED_HOST.test(url.hostname)) return null;

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const source = Buffer.from(await res.arrayBuffer());
    if (source.length === 0 || source.length > MAX_SOURCE_BYTES) return null;

    const webp = await sharp(source)
      .resize(360, 640, { fit: "cover", position: "attention" })
      .webp({ quality: 72 })
      .toBuffer();

    const path = `video-thumbs/${videoId}.webp`;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, webp, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (error) {
      console.error("Could not upload the video thumbnail", error);
      return null;
    }
    return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (err) {
    console.error("Could not create the video thumbnail", err);
    return null;
  }
}

export async function removeVideoThumbnail(videoId: string) {
  if (!/^\d{8,25}$/.test(videoId)) return;
  await supabaseAdmin.storage.from(BUCKET).remove([`video-thumbs/${videoId}.webp`]);
}
