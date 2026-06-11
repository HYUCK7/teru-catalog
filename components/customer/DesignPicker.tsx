"use client";

import { useState } from "react";
import type { ProductImage } from "@/lib/supabase/types";

export function DesignPicker({
  images,
  error,
}: {
  images: ProductImage[];
  error?: string;
}) {
  const [selected, setSelected] = useState("");

  return (
    <section className="space-y-2 rounded border p-3">
      <p className="text-sm font-medium">디자인 선택</p>
      <div className="grid grid-cols-2 gap-2">
        {images.map((image, index) => {
          const checked = selected === image.image_url;
          return (
            <label
              key={image.id}
              className={`relative overflow-hidden rounded border ${
                checked ? "border-black ring-2 ring-black" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.image_url}
                alt={`디자인 ${index + 1}`}
                className="aspect-square w-full object-cover"
              />
              <span
                className={`absolute top-2 left-2 rounded-full px-2 py-1 text-xs font-medium ${
                  checked ? "bg-black text-white" : "bg-white/90 text-gray-700"
                }`}
              >
                {index + 1}
              </span>
              <input
                type="radio"
                name="design_image_url"
                value={image.image_url}
                checked={checked}
                onChange={() => setSelected(image.image_url)}
                className="sr-only"
              />
            </label>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
