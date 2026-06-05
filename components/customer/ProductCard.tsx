import Link from "next/link";
import type { Product } from "@/lib/supabase/types";

export function ProductCard({
  product,
  thumbnail,
}: {
  product: Product;
  thumbnail?: string;
}) {
  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="aspect-square w-full overflow-hidden rounded bg-gray-100">
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="mt-1 text-sm">{product.name}</div>
      <div className="font-bold">{product.price.toLocaleString()}원</div>
    </Link>
  );
}
