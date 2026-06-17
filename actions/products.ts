"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addProductImage,
  createProduct,
  deleteProduct,
  deleteProductImage,
  getNextProductImageSortOrder,
  updateProduct,
  updateProductImageSortOrders,
  updateProductSortOrders,
} from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";
import { validateProductInput } from "@/lib/validation";

type SaveResult = { ok: boolean; errors: Record<string, string>; id?: string };

export async function saveProduct(
  productId: string | null,
  _prev: unknown,
  formData: FormData,
): Promise<SaveResult> {
  const name = String(formData.get("name") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const categoryId = String(formData.get("category_id") ?? "");
  const description = String(formData.get("description") ?? "");
  const isVisible = formData.get("is_visible") === "on";
  const flavorEnabled = formData.get("flavor_enabled") === "on";
  const optionEnabled = formData.get("option_enabled") === "on";
  const validation = validateProductInput({ name, price, categoryId });

  if (!validation.ok) return { ok: false, errors: validation.errors };

  const supabase = await createClient();
  const input = {
    name,
    price,
    categoryId,
    description,
    isVisible,
    flavorEnabled,
    optionEnabled,
  };
  let id = productId;

  if (id) {
    await updateProduct(supabase, id, input);
  } else {
    const created = await createProduct(supabase, input);
    id = created.id;
  }

  const newImages = String(formData.get("new_image_urls") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const firstNewImageSortOrder = await getNextProductImageSortOrder(
    supabase,
    id,
  );
  for (let index = 0; index < newImages.length; index += 1) {
    await addProductImage(
      supabase,
      id,
      newImages[index],
      firstNewImageSortOrder + index,
    );
  }

  revalidatePath("/menu");
  revalidatePath(`/products/${id}`);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function removeProduct(id: string) {
  const supabase = await createClient();
  await deleteProduct(supabase, id);
  revalidatePath("/menu");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function saveProductSortOrders(formData: FormData) {
  const productIds = formData.getAll("product_id").map(String);
  const updates = productIds.map((id, index) => ({
    id,
    sortOrder: index,
  }));

  const supabase = await createClient();
  await updateProductSortOrders(supabase, updates);
  revalidatePath("/menu");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function saveProductImageSortOrders(
  productId: string,
  orderedImageIds: string[],
) {
  const updates = orderedImageIds.map((id, index) => ({
    id,
    sortOrder: index,
  }));

  const supabase = await createClient();
  await updateProductImageSortOrders(supabase, updates);
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${productId}`);
}

export async function removeImage(imageId: string, productId: string) {
  const supabase = await createClient();
  await deleteProductImage(supabase, imageId);
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${productId}`);
}
