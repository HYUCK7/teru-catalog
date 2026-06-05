"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/server";
import { validateCategoryInput } from "@/lib/validation";

export async function addCategory(_prev: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const validation = validateCategoryInput({ name });

  if (!validation.ok) return { ok: false, error: validation.errors.name };

  const supabase = await createClient();
  const existing = await getCategories(supabase);
  await createCategory(supabase, name.trim(), existing.length);
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ok: true, error: "" };
}

export async function renameCategory(id: string, name: string) {
  const validation = validateCategoryInput({ name });
  if (!validation.ok) return { ok: false, error: validation.errors.name };

  const supabase = await createClient();
  await updateCategory(supabase, id, { name: name.trim() });
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ok: true, error: "" };
}

export async function removeCategory(id: string) {
  const supabase = await createClient();

  try {
    await deleteCategory(supabase, id);
  } catch {
    return {
      ok: false,
      error: "이 카테고리에 속한 상품이 있어 삭제할 수 없습니다.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ok: true, error: "" };
}
