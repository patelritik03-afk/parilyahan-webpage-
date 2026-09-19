import GalleryManager from "@/components/GalleryManager";

export default function AdminGalleryPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Gallery</h1>
      <p className="mt-1 text-sm text-muted">
        Photos you upload here appear on the public Gallery page immediately.
      </p>
      <div className="mt-6">
        <GalleryManager />
      </div>
    </div>
  );
}
