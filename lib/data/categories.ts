import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/lib/supabase/types";

export async function getCategories(
  supabase: SupabaseClient,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as Category[];
}

export async function getCategoryById(
  supabase: SupabaseClient,
  id: string,
): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as Category;
}

export async function createCategory(
  supabase: SupabaseClient,
  name: string,
  sortOrder: number,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, sort_order: sortOrder })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Category;
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  fields: { name?: string; sort_order?: number; design_enabled?: boolean },
): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update(fields)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function updateCategorySortOrders(
  supabase: SupabaseClient,
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  await Promise.all(
    updates.map(async ({ id, sortOrder }) => {
      const { error } = await supabase
        .from("categories")
        .update({ sort_order: sortOrder })
        .eq("id", id);

      if (error) throw new Error(error.message);
    }),
  );
}

export async function deleteCategory(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw new Error(error.message);
}
