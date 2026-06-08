import { notFound } from "next/navigation";
import { removeProduct } from "@/actions/products";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/data/categories";
import { getProductWithImages } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const categories = await getCategories(supabase);
  const isNew = id === "new";
  const product = isNew ? null : await getProductWithImages(supabase, id);

  if (!isNew && !product) notFound();

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">
          {isNew ? "상품 추가" : "상품 수정"}
        </h1>
        {!isNew && product && (
          <form action={removeProduct.bind(null, product.id)}>
            <Button type="submit" variant="destructive" size="sm">
              삭제
            </Button>
          </form>
        )}
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
