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
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { removeImage, saveProductImageSortOrders } from "@/actions/products";
import type { ProductImage } from "@/lib/supabase/types";

export function ProductImageGrid({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const [items, setItems] = useState(
    [...images].sort((a, b) => a.sort_order - b.sort_order),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((image) => image.id === active.id);
    const newIndex = items.findIndex((image) => image.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    void saveProductImageSortOrders(
      productId,
      next.map((image) => image.id),
    );
  }

  function handleRemove(imageId: string) {
    setItems((current) => current.filter((image) => image.id !== imageId));
    void removeImage(imageId, productId);
  }

  if (items.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((image) => image.id)}
        strategy={horizontalListSortingStrategy}
      >
        {items.map((image) => (
          <SortableImage
            key={image.id}
            image={image}
            onRemove={() => handleRemove(image.id)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableImage({
  image,
  onRemove,
}: {
  image: ProductImage;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative touch-none ${
        isDragging ? "z-10 opacity-70 shadow-sm" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.image_url}
        alt=""
        className="h-20 w-20 cursor-grab rounded object-cover active:cursor-grabbing"
      />
      <button
        type="button"
        onClick={onRemove}
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1 text-xs text-white"
      >
        x
      </button>
    </div>
  );
}
