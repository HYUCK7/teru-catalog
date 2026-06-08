"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";

export function ImageUploader({
  bucket,
  pathPrefix,
  onUploaded,
}: {
  bucket: "public-assets" | "products";
  pathPrefix: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputId = `${bucket}-${pathPrefix.replace(/[^a-zA-Z0-9_-]/g, "_")}-image-upload`;

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${pathPrefix}/${Date.now()}-${safeName}`;
      const url = await uploadImage(supabase, bucket, path, file);
      onUploaded(url);
      event.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={busy}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className={`flex h-20 w-20 items-center justify-center rounded border-2 border-dashed text-2xl text-gray-400 transition-colors ${
          busy
            ? "cursor-not-allowed bg-gray-50"
            : "cursor-pointer hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600"
        }`}
      >
        {busy ? "..." : "+"}
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
