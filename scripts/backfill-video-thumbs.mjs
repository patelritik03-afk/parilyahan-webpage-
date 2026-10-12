// Creates the small preview picture for videos that were added before previews existed.
// Run from the project folder:  node --env-file=.env.local scripts/backfill-video-thumbs.mjs
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const BUCKET = "site-images";
const ALLOWED_HOST = /(^|\.)(tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com|tiktokv\.com)$/i;

const { data: videos, error } = await supabase.from("videos").select("id, video_id, url").is("thumb_url", null);
if (error) throw error;
console.log(`${videos.length} video(s) need a preview picture`);

for (const video of videos) {
  try {
    const oembed = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(video.url)}`, {
      signal: AbortSignal.timeout(10000),
    }).then((r) => (r.ok ? r.json() : null));
    const thumb = oembed?.thumbnail_url ? new URL(oembed.thumbnail_url) : null;
    if (!thumb || thumb.protocol !== "https:" || !ALLOWED_HOST.test(thumb.hostname)) {
      console.log(`- ${video.video_id}: no usable preview from TikTok, skipped`);
      continue;
    }
    const source = Buffer.from(await (await fetch(thumb, { signal: AbortSignal.timeout(15000) })).arrayBuffer());
    const webp = await sharp(source).resize(360, 640, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toBuffer();
    const path = `video-thumbs/${video.video_id}.webp`;
    const up = await supabase.storage.from(BUCKET).upload(path, webp, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (up.error) throw up.error;
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const upd = await supabase.from("videos").update({ thumb_url: publicUrl }).eq("id", video.id);
    if (upd.error) throw upd.error;
    console.log(`- ${video.video_id}: saved (${Math.round(webp.length / 1024)} KB)`);
  } catch (err) {
    console.log(`- ${video.video_id}: failed - ${err.message}`);
  }
}
