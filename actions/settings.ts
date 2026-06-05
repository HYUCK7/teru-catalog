"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "@/lib/data/settings";
import { validateSettingsInput } from "@/lib/validation";

export async function saveSettings(_prev: unknown, formData: FormData) {
  const shop_name = String(formData.get("shop_name") ?? "");
  const validation = validateSettingsInput({ shop_name });

  if (!validation.ok) return { ok: false, errors: validation.errors };

  const supabase = await createClient();
  await updateSettings(supabase, {
    shop_name,
    intro: String(formData.get("intro") ?? ""),
    logo_url: emptyToNull(formData.get("logo_url")),
    banner_url: emptyToNull(formData.get("banner_url")),
    kakao_channel_url: emptyToNull(formData.get("kakao_channel_url")),
    phone: emptyToNull(formData.get("phone")),
    instagram: emptyToNull(formData.get("instagram")),
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, errors: {} };
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}
