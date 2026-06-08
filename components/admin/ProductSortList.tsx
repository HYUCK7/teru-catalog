"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { saveProductSortOrders } from "@/actions/products";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/supabase/types";
import { GripVertical } from "lucide-react";
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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const oldIndex = current.findIndex((product) => product.id === active.id);
      const newIndex = current.findIndex((product) => product.id === over.id);

      if (oldIndex < 0 || newIndex < 0) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  if (items.length === 0) {
    return <p className="p-4 text-gray-500">등록된 상품이 없습니다.</p>;
  }

  return (
    <form action={saveProductSortOrders}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((product) => product.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="divide-y">
            {items.map((product) => (
              <SortableProductRow
                key={product.id}
                product={product}
                categoryNames={categoryNames}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <div className="flex justify-end p-4">
        <Button type="submit">노출 순서 저장</Button>
      </div>
    </form>
  );
}

function SortableProductRow({
  product,
  categoryNames,
}: {
  product: Product;
  categoryNames: Record<string, string>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-3 bg-white p-4 ${
        isDragging ? "relative z-10 opacity-70 shadow-sm" : ""
      }`}
    >
      <input type="hidden" name="product_id" value={product.id} />
      <button
        type="button"
        aria-label={`${product.name} 순서 변경 핸들`}
        className="cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="flex-1 text-sm">{product.name}</span>
      <span className="text-sm text-gray-500">
        {product.category_id
          ? (categoryNames[product.category_id] ?? "-")
          : "-"}
      </span>
      <span className="text-sm">{product.price.toLocaleString()}원</span>
      <span className={product.is_visible ? "text-green-600" : "text-gray-400"}>
        {product.is_visible ? "노출" : "숨김"}
      </span>
      <Link
        href={`/admin/products/${product.id}`}
        className="text-sm underline"
      >
        편집
      </Link>
    </li>
  );
}
