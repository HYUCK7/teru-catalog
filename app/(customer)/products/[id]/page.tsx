import { BackButton } from "@/components/BackButton";
import { ContactButtons } from "@/components/customer/ContactButtons";
import { ProductGallery } from "@/components/customer/ProductGallery";
import { getProductWithImages } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await getProductWithImages(supabase, id);

  if (!product || !product.is_visible) notFound();

  const settings = await getSettings(supabase);

  return (
    <main className="mx-auto max-w-md pb-8">
      <div className="p-4">
        <BackButton label="뒤로" />
      </div>
      <ProductGallery images={product.images} />
      <div className="space-y-3 p-4">
        <h1 className="text-lg font-bold">{product.name}</h1>
        <div className="text-xl font-extrabold">
          {product.price.toLocaleString()}원
        </div>
        <p className="whitespace-pre-wrap text-gray-700">
          {product.description}
        </p>
        <div className="space-y-2 pt-4">
          <Link
            href={`/products/${product.id}/order`}
            className="block rounded bg-black py-3 text-center text-white"
          >
            주문하기
          </Link>
          <ContactButtons settings={settings} />
        </div>
      </div>
    </main>
  );
}
