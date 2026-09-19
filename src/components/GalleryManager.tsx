"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { GalleryImage } from "@/lib/types";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadImages() {
    setLoading(true);
    fetch("/api/admin/gallery")
      .then((res) => res.json())
      .then((data) => setImages(data.images ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.resolve().then(loadImages);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Photo is too large (max 4 MB). Please resize it and try again.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/gallery", { method: "POST", body: formData });

    if (res.ok) {
      loadImages();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Upload failed. Please try again.");
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
    await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <label className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 cursor-pointer">
          {uploading ? "Uploading..." : "Upload Photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : images.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
            No photos yet. Upload your first one above.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg bg-surface">
                <Image src={image.url} alt={image.caption ?? ""} fill sizes="25vw" className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
