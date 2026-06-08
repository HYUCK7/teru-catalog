"use client";

import { useMemo, useState } from "react";
import type { ProductImage } from "@/lib/supabase/types";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.sort_order - b.sort_order),
    [images],
  );
  const [activeId, setActiveId] = useState(sortedImages[0]?.id ?? "");
  const activeImage = useMemo(
    () =>
      sortedImages.find((image) => image.id === activeId) ?? sortedImages[0],
    [activeId, sortedImages],
  );
  const thumbnails = useMemo(
    () => sortedImages.filter((image) => image.id !== activeImage?.id),
    [activeImage?.id, sortedImages],
  );

  if (sortedImages.length === 0) {
    return <div className="aspect-square w-full bg-gray-100" />;
  }

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeImage.image_url}
        alt=""
        className="aspect-square w-full object-cover"
      />
      {thumbnails.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto px-4">
          {thumbnails.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveId(image.id)}
              className="h-16 w-16 flex-none overflow-hidden rounded bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
