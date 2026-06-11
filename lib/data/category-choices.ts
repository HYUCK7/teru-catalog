import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryChoice, ChoiceKind } from "@/lib/supabase/types";

export type CategoryChoiceWriteInput = {
  categoryId: string;
  kind: ChoiceKind;
  label: string;
  price: number;
};

export async function getChoicesByCategory(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<CategoryChoice[]> {
  const { data, error } = await supabase
    .from("category_choices")
    .select("*")
    .eq("category_id", categoryId)
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as CategoryChoice[];
}

export async function getChoicesForCategories(
  supabase: SupabaseClient,
  categoryIds: string[],
): Promise<Record<string, CategoryChoice[]>> {
  if (categoryIds.length === 0) return {};

  const { data, error } = await supabase
    .from("category_choices")
    .select("*")
    .in("category_id", categoryIds)
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const grouped: Record<string, CategoryChoice[]> = {};
  for (const choice of (data ?? []) as CategoryChoice[]) {
    grouped[choice.category_id] ??= [];
    grouped[choice.category_id].push(choice);
  }

  return grouped;
}

export async function getNextChoiceSortOrder(
  supabase: SupabaseClient,
  categoryId: string,
  kind: ChoiceKind,
): Promise<number> {
  const { data, error } = await supabase
    .from("category_choices")
    .select("sort_order")
    .eq("category_id", categoryId)
    .eq("kind", kind)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  const lastSortOrder = (data?.[0] as { sort_order?: number } | undefined)
    ?.sort_order;
  return typeof lastSortOrder === "number" ? lastSortOrder + 1 : 0;
}

export async function addCategoryChoice(
  supabase: SupabaseClient,
  input: CategoryChoiceWriteInput & { sortOrder: number },
): Promise<void> {
  const { error } = await supabase.from("category_choices").insert({
    category_id: input.categoryId,
    kind: input.kind,
    label: input.label,
    price: input.price,
    sort_order: input.sortOrder,
  });

  if (error) throw new Error(error.message);
}

export async function updateCategoryChoice(
  supabase: SupabaseClient,
  id: string,
  fields: { label: string; price: number },
): Promise<void> {
  const { error } = await supabase
    .from("category_choices")
    .update(fields)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function removeCategoryChoice(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("category_choices")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
