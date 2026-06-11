import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Product,
  ProductImage,
  ProductWithImages,
} from "@/lib/supabase/types";

export type ProductWriteInput = {
  name: string;
  price: number;
  categoryId: string;
  description: string;
  isVisible: boolean;
  flavorEnabled: boolean;
  optionEnabled: boolean;
};

export async function getVisibleProductsByCategory(
  supabase: SupabaseClient,
  categoryId: string | null,
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as Product[];
}

export async function getProductWithImages(
  supabase: SupabaseClient,
  id: string,
): Promise<ProductWithImages | null> {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  const { data: images, error: imageError } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true })
    .order("image_url", { ascending: true });

  if (imageError) throw new Error(imageError.message);

  return { ...(product as Product), images: (images ?? []) as ProductImage[] };
}

export async function getAllProducts(
  supabase: SupabaseClient,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as Product[];
}

export async function createProduct(
  supabase: SupabaseClient,
  input: ProductWriteInput,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      price: input.price,
      category_id: input.categoryId,
      description: input.description,
      is_visible: input.isVisible,
      flavor_enabled: input.flavorEnabled,
      option_enabled: input.optionEnabled,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Product;
}

export async function updateProduct(
  supabase: SupabaseClient,
  id: string,
  input: ProductWriteInput,
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      price: input.price,
      category_id: input.categoryId,
      description: input.description,
      is_visible: input.isVisible,
      flavor_enabled: input.flavorEnabled,
      option_enabled: input.optionEnabled,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function updateProductSortOrders(
  supabase: SupabaseClient,
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  await Promise.all(
    updates.map(async ({ id, sortOrder }) => {
      const { error } = await supabase
        .from("products")
        .update({ sort_order: sortOrder })
        .eq("id", id);

      if (error) throw new Error(error.message);
    }),
  );
}

export async function deleteProduct(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function addProductImage(
  supabase: SupabaseClient,
  productId: string,
  imageUrl: string,
  sortOrder: number,
): Promise<void> {
  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: imageUrl,
    sort_order: sortOrder,
  });

  if (error) throw new Error(error.message);
}

export async function getNextProductImageSortOrder(
  supabase: SupabaseClient,
  productId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  const lastSortOrder = (data?.[0] as { sort_order?: number } | undefined)
    ?.sort_order;
  return typeof lastSortOrder === "number" ? lastSortOrder + 1 : 0;
}

export async function deleteProductImage(
  supabase: SupabaseClient,
  imageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) throw new Error(error.message);
}

export async function getThumbnailMap(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Record<string, string>> {
  if (productIds.length === 0) return {};

  const { data, error } = await supabase
    .from("product_images")
    .select("product_id,image_url,sort_order")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true })
    .order("image_url", { ascending: true });

  if (error) throw new Error(error.message);

  const map: Record<string, string> = {};
  for (const row of (data ?? []) as {
    product_id: string;
    image_url: string;
  }[]) {
    if (!map[row.product_id]) map[row.product_id] = row.image_url;
  }

  return map;
}
