"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Product } from "@/lib/supabase/types";
import { ProductCard } from "./ProductCard";

type MenuClientProps = {
  categories: Category[];
  products: Product[];
  thumbnails: Record<string, string>;
  initialCat: string | null;
};

export function MenuClient({
  categories,
  products,
  thumbnails,
  initialCat,
}: MenuClientProps) {
  const [activeCat, setActiveCat] = useState(initialCat);
  const filteredProducts = useMemo(() => {
    if (!activeCat) return products;
    return products.filter((product) => product.category_id === activeCat);
  }, [activeCat, products]);

  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      setActiveCat(params.get("cat"));
    }

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function selectCategory(categoryId: string | null) {
    setActiveCat(categoryId);
    window.history.pushState(
      {},
      "",
      categoryId ? `/menu?cat=${categoryId}` : "/menu",
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        <Tab
          active={!activeCat}
          label="전체"
          onClick={() => selectCategory(null)}
        />
        {categories.map((category) => (
          <Tab
            key={category.id}
            active={activeCat === category.id}
            label={category.name}
            onClick={() => selectCategory(category.id)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            thumbnail={thumbnails[product.id]}
          />
        ))}
      </div>
      {filteredProducts.length === 0 && (
        <p className="py-10 text-center text-gray-500">상품이 없습니다.</p>
      )}
    </>
  );
}

function Tab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-1 text-sm whitespace-nowrap ${
        active ? "bg-black text-white" : "bg-white"
      }`}
    >
      {label}
    </button>
  );
}
