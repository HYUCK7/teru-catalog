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
  const { error } = await supabase
    .from("site_settings")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) throw new Error(error.message);
}
