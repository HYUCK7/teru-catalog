import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/data/categories";
import { getAllProducts } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    getAllProducts(supabase),
    getCategories(supabase),
  ]);
  const categoryName = (id: string | null) =>
    categories.find((category) => category.id === id)?.name ?? "-";

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">상품 관리</h1>
        <Link href="/admin/products/new">
          <Button>+ 상품 추가</Button>
        </Link>
      </div>
      <ul className="divide-y">
        {products.map((product) => (
          <li key={product.id} className="flex items-center gap-3 p-4">
            <span className="flex-1">{product.name}</span>
            <span className="text-sm text-gray-500">
              {categoryName(product.category_id)}
            </span>
            <span className="text-sm">{product.price.toLocaleString()}원</span>
            <span
              className={product.is_visible ? "text-green-600" : "text-gray-400"}
            >
              {product.is_visible ? "노출" : "숨김"}
            </span>
            <Link
              href={`/admin/products/${product.id}`}
              className="text-sm underline"
            >
              편집
            </Link>
          </li>
        ))}
        {products.length === 0 && (
          <li className="p-4 text-gray-500">등록된 상품이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
