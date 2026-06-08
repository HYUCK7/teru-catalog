import { BackButton } from "@/components/BackButton";
import { MenuClient } from "@/components/customer/MenuClient";
import { getCategories } from "@/lib/data/categories";
import {
  getThumbnailMap,
  getVisibleProductsByCategory,
} from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const supabase = await createClient();
  const [categories, products] = await Promise.all([
    getCategories(supabase),
    getVisibleProductsByCategory(supabase, null),
  ]);
  const thumbnails = await getThumbnailMap(
    supabase,
    products.map((product) => product.id),
  );

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-3">
        <BackButton href="/" label="메인" />
      </div>
      <MenuClient
        categories={categories}
        products={products}
        thumbnails={thumbnails}
        initialCat={cat ?? null}
      />
    </main>
  );
}
