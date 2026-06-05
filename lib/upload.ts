import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: { type: string; size: number }) {
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "jpg/png/webp만 업로드할 수 있습니다." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "이미지는 10MB 이하만 가능합니다." };
  }
  return { ok: true, error: "" };
}

export async function uploadImage(
  supabase: SupabaseClient,
  bucket: "public-assets" | "products",
  path: string,
  file: File,
): Promise<string> {
  const check = validateImageFile(file);
  if (!check.ok) throw new Error(check.error);

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
