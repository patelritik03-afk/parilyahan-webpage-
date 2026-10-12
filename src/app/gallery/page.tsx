import { supabaseAdmin } from "@/lib/supabase";
import GalleryGrid from "@/components/GalleryGrid";
import GalleryHeader from "@/components/GalleryHeader";
import type { GalleryImage } from "@/lib/types";

export const metadata = {
  title: "Gallery",
  description:
    "Photos of our Filipino buffet dishes, from grilled favorites and kare-kare to lumpia and desserts, at Parilyahan Sa Kalye in Dubai.",
  alternates: { canonical: "/gallery" },
};

export const revalidate = 0;

export default async function GalleryPage() {
  const { data } = await supabaseAdmin
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: true });

  const images = (data ?? []) as GalleryImage[];

  return (
    <>
      <GalleryHeader />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <GalleryGrid images={images} />
      </div>
    </>
  );
}
