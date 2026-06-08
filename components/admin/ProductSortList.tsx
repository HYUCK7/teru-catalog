"use client";

import { saveProductSortOrders } from "@/actions/products";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/supabase/types";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ProductSortList({
  products,
  categoryNames,
}: {
  products: Product[];
  categoryNames: Record<string, string>;
}) {
  const [items, setItems] = useState(products);

  function moveByIndex(fromIndex: number, toIndex: number) {
    setItems((current) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length ||
        fromIndex === toIndex
      ) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  if (items.length === 0) {
    return <p className="p-4 text-gray-500">등록된 상품이 없습니다.</p>;
  }

  return (
    <form action={saveProductSortOrders}>
      <ul className="divide-y">
        {items.map((product, index) => (
          <li key={product.id} className="flex items-center gap-3 p-4">
            <input type="hidden" name="product_id" value={product.id} />
            
            <span className="flex-1 text-sm">{product.name}</span>
            <span className="text-sm text-gray-500">
              {product.category_id
                ? (categoryNames[product.category_id] ?? "-")
                : "-"}
            </span>
            <span className="text-sm">{product.price.toLocaleString()}원</span>
            <span
              className={
                product.is_visible ? "text-green-600" : "text-gray-400"
              }
            >
              {product.is_visible ? "노출" : "숨김"}
            </span>
            <Link
              href={`/admin/products/${product.id}`}
              className="text-sm underline"
            >
              편집
            </Link>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                disabled={index === 0}
                aria-label={`${product.name} 위로 이동`}
                onClick={() => moveByIndex(index, index - 1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                disabled={index === items.length - 1}
                aria-label={`${product.name} 아래로 이동`}
                onClick={() => moveByIndex(index, index + 1)}
              >
                <ArrowDown />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex justify-end p-4">
        <Button type="submit">노출 순서 저장</Button>
      </div>
    </form>
  );
}
