import "server-only";
import { supabaseAdmin } from "./supabase";

export type VideoRow = {
  id: string;
  video_id: string;
  url: string;
  title: string | null;
  author: string | null;
  thumb_url: string | null;
  created_at: string;
};

// Never throws: if the table is missing or Supabase is down, the pages just show no videos.
export async function getVideos(limit = 100): Promise<VideoRow[]> {
  const { data, error } = await supabaseAdmin
    .from("videos")
    .select("id, video_id, url, title, author, thumb_url, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}
