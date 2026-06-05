import Link from "next/link";
import { ProductCard } from "@/components/customer/ProductCard";
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
  const categories = await getCategories(supabase);
  const activeCat = cat ?? null;
  const products = await getVisibleProductsByCategory(supabase, activeCat);
  const thumbnails = await getThumbnailMap(
    supabase,
    products.map((product) => product.id),
  );

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex gap-2 overflow-x-auto">
        <Tab href="/menu" active={!activeCat} label="전체" />
        {categories.map((category) => (
          <Tab
            key={category.id}
            href={`/menu?cat=${category.id}`}
            active={activeCat === category.id}
            label={category.name}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            thumbnail={thumbnails[product.id]}
          />
        ))}
      </div>
      {products.length === 0 && (
        <p className="py-10 text-center text-gray-500">상품이 없습니다.</p>
      )}
    </main>
  );
}

function Tab({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full border px-4 py-1 text-sm ${
        active ? "bg-black text-white" : "bg-white"
      }`}
    >
      {label}
    </Link>
  );
}
