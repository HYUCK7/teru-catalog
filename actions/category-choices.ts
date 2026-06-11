"use server";

import { revalidatePath } from "next/cache";
import { isChoiceKind } from "@/lib/customization";
import {
  addCategoryChoice,
  getNextChoiceSortOrder,
  removeCategoryChoice,
  updateCategoryChoice,
} from "@/lib/data/category-choices";
import { createClient } from "@/lib/supabase/server";
import { MAX_INT_PRICE } from "@/lib/validation";

type ChoiceResult = { ok: boolean; error: string };

function validateChoice(label: string, price: number): ChoiceResult {
  if (!label.trim()) return { ok: false, error: "항목 이름을 입력하세요." };
  if (
    !Number.isFinite(price) ||
    !Number.isInteger(price) ||
    price < 0 ||
    price > MAX_INT_PRICE
  ) {
    return {
      ok: false,
      error: `추가 금액은 0 이상 ${MAX_INT_PRICE.toLocaleString()} 이하의 정수여야 합니다.`,
    };
  }

  return { ok: true, error: "" };
}

export async function addChoice(formData: FormData): Promise<ChoiceResult> {
  const categoryId = String(formData.get("category_id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const label = String(formData.get("label") ?? "");
  const price = Number(formData.get("price") ?? 0);

  if (!categoryId || !isChoiceKind(kind)) {
    return { ok: false, error: "항목 정보를 확인하세요." };
  }

  const validation = validateChoice(label, price);
  if (!validation.ok) return validation;

  const supabase = await createClient();
  const sortOrder = await getNextChoiceSortOrder(supabase, categoryId, kind);
  await addCategoryChoice(supabase, {
    categoryId,
    kind,
    label: label.trim(),
    price,
    sortOrder,
  });

  revalidateCustomizationPaths();
  return { ok: true, error: "" };
}

export async function editChoice(formData: FormData): Promise<ChoiceResult> {
  const id = String(formData.get("choice_id") ?? "");
  const label = String(formData.get("label") ?? "");
  const price = Number(formData.get("price") ?? 0);

  if (!id) return { ok: false, error: "항목 정보를 확인하세요." };

  const validation = validateChoice(label, price);
  if (!validation.ok) return validation;

  const supabase = await createClient();
  await updateCategoryChoice(supabase, id, {
    label: label.trim(),
    price,
  });

  revalidateCustomizationPaths();
  return { ok: true, error: "" };
}

export async function deleteChoice(id: string): Promise<ChoiceResult> {
  if (!id) return { ok: false, error: "항목 정보를 확인하세요." };

  const supabase = await createClient();
  await removeCategoryChoice(supabase, id);
  revalidateCustomizationPaths();

  return { ok: true, error: "" };
}

function revalidateCustomizationPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/menu");
}
