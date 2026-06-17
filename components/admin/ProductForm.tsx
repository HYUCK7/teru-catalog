"use client";

import { useActionState, useState } from "react";
import { saveProduct } from "@/actions/products";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ProductImageGrid } from "@/components/admin/ProductImageGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category, ProductWithImages } from "@/lib/supabase/types";
import { MAX_INT_PRICE } from "@/lib/validation";

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product: ProductWithImages | null;
}) {
  const action = saveProduct.bind(null, product?.id ?? null);
  const [state, formAction, pending] = useActionState(action, null);
  const [newUrls, setNewUrls] = useState<string[]>([]);

  return (
    <form action={formAction} className="max-w-lg space-y-4 p-4">
      <div>
        <Label>상품 사진</Label>
        <div className="my-2 flex flex-wrap gap-2">
          {product && (
            <ProductImageGrid productId={product.id} images={product.images} />
          )}
          {newUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-20 w-20 rounded object-cover ring-2 ring-green-500"
            />
          ))}
          <ImageUploader
            bucket="products"
            pathPrefix={product?.id ?? "new"}
            onUploaded={(url) => setNewUrls((prev) => [...prev, url])}
          />
        </div>
        <input type="hidden" name="new_image_urls" value={newUrls.join(",")} />
      </div>

      <div>
        <Label htmlFor="name">상품명</Label>
        <Input id="name" name="name" defaultValue={product?.name ?? ""} />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="category_id">카테고리</Label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={product?.category_id ?? ""}
          className="block w-full rounded border p-2"
        >
          <option value="">선택</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {state?.errors?.categoryId && (
          <p className="text-sm text-red-600">{state.errors.categoryId}</p>
        )}
      </div>

      <div>
        <Label htmlFor="price">가격</Label>
        <Input
          id="price"
          name="price"
          type="number"
          min={0}
          max={MAX_INT_PRICE}
          step={1}
          defaultValue={product?.price ?? 0}
        />
        {state?.errors?.price && (
          <p className="text-sm text-red-600">{state.errors.price}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_visible"
          defaultChecked={product?.is_visible ?? true}
        />
        노출하기
      </label>

      <div className="space-y-2 rounded border p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="flavor_enabled"
            defaultChecked={product?.flavor_enabled ?? false}
          />
          맛 선택 받기 (다중)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="option_enabled"
            defaultChecked={product?.option_enabled ?? false}
          />
          옵션 선택 받기 (다중)
        </label>
        <p className="text-xs text-gray-500">
          맛과 옵션 항목은 카테고리 관리에서 등록합니다.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}
