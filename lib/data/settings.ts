import type { SupabaseClient } from "@supabase/supabase-js";
import type { SiteSettings } from "@/lib/supabase/types";

export async function getSettings(
  supabase: SupabaseClient,
): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw new Error(error.message);

  return data as SiteSettings;
}

export async function updateSettings(
  supabase: SupabaseClient,
  fields: Partial<Omit<SiteSettings, "id" | "updated_at">>,
): Promise<void> {
  const payload = { ...fields, updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("site_settings")
    .update(payload)
    .eq("id", 1);

  if (!error) return;

  if (!isMissingContactLabelColumnError(error.message)) {
    throw new Error(error.message);
  }

  const { error: retryError } = await supabase
    .from("site_settings")
    .update(withoutContactLabelFields(payload))
    .eq("id", 1);

  if (retryError) throw new Error(retryError.message);
}

function isMissingContactLabelColumnError(message: string | undefined): boolean {
  return (
    message?.includes("schema cache") === true &&
    /'(kakao_label|phone_label|instagram_label)'/.test(message)
  );
}

function withoutContactLabelFields<T extends Record<string, unknown>>(fields: T) {
  const rest = { ...fields };
  delete rest.kakao_label;
  delete rest.phone_label;
  delete rest.instagram_label;
  return rest;
}
