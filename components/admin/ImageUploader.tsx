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
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={busy}
      />
      {busy && <p className="text-sm text-gray-500">업로드 중...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
