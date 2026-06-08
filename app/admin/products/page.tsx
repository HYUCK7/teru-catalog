import { AdminNav } from "@/components/admin/AdminNav";
import { ProductSortList } from "@/components/admin/ProductSortList";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/data/categories";
import { getAllProducts } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    getAllProducts(supabase),
    getCategories(supabase),
  ]);
  const categoryNames = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">상품 관리</h1>
        <Link href="/admin/products/new">
          <Button>+ 상품 추가</Button>
        </Link>
      </div>
      <ProductSortList products={products} categoryNames={categoryNames} />
    </div>
  );
}
