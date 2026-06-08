"use client";

import { useActionState, useState } from "react";
import { removeImage, saveProduct } from "@/actions/products";
import { ImageUploader } from "@/components/admin/ImageUploader";
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
          {product?.images.map((image) => (
            <div key={image.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.image_url}
                alt=""
                className="h-20 w-20 rounded object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(image.id, product.id)}
                className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1 text-xs text-white"
              >
                x
              </button>
            </div>
          ))}
          {newUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-20 w-20 rounded object-cover ring-2 ring-green-500"
            />
          ))}
        </div>
        <ImageUploader
          bucket="products"
          pathPrefix={product?.id ?? "new"}
          onUploaded={(url) => setNewUrls((prev) => [...prev, url])}
        />
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

      <Button type="submit" disabled={pending}>
        {pending ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}
