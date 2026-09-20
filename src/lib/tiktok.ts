import "server-only";

const TIKTOK_HOST = /(^|\.)tiktok\.com$/i;
const SHORT_HOSTS = /^(vm|vt)\.tiktok\.com$/i;
const VIDEO_ID = /\/video\/(\d{8,25})/;

export type TikTokVideo = { videoId: string; url: string; title: string | null; author: string | null };

function parseTikTokUrl(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return TIKTOK_HOST.test(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

// Short links (vm.tiktok.com/..., tiktok.com/t/...) redirect to the full video address.
async function resolveShortLink(url: URL): Promise<URL | null> {
  const isShort = SHORT_HOSTS.test(url.hostname) || url.pathname.startsWith("/t/");
  if (!isShort) return url;
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(6000) });
    const location = res.headers.get("location");
    return location ? parseTikTokUrl(new URL(location, url).toString()) : null;
  } catch {
    return null;
  }
}

async function fetchOEmbed(url: string): Promise<{ title: string | null; author: string | null }> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { title: null, author: null };
    const data = (await res.json()) as { title?: string; author_name?: string };
    return { title: data.title?.slice(0, 300) || null, author: data.author_name?.slice(0, 100) || null };
  } catch {
    return { title: null, author: null };
  }
}

// Turns whatever the owner pasted into a video id. Only TikTok addresses are accepted.
export async function resolveTikTokVideo(input: string): Promise<TikTokVideo | null> {
  const parsed = parseTikTokUrl(input);
  if (!parsed) return null;
  const full = await resolveShortLink(parsed);
  if (!full) return null;

  const videoId = full.pathname.match(VIDEO_ID)?.[1];
  if (!videoId) return null;

  const canonical = `${full.origin}${full.pathname}`;
  const info = await fetchOEmbed(canonical);
  return { videoId, url: canonical, ...info };
}
