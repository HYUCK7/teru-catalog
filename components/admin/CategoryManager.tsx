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
import { useActionState, useState, useTransition } from "react";
import {
  addCategory,
  removeCategory,
  renameCategory,
  saveCategorySortOrders,
  setCategoryDesignEnabled,
} from "@/actions/categories";
import { CategoryChoiceManager } from "@/components/admin/CategoryChoiceManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category, CategoryChoice } from "@/lib/supabase/types";
import { GripVertical } from "lucide-react";

export function CategoryManager({
  categories,
  choicesByCategory,
}: {
  categories: Category[];
  choicesByCategory: Record<string, CategoryChoice[]>;
}) {
  const [state, action, pending] = useActionState(addCategory, null);
  const [items, setItems] = useState(categories);
  const [message, setMessage] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const oldIndex = current.findIndex(
        (category) => category.id === active.id,
      );
      const newIndex = current.findIndex((category) => category.id === over.id);

      if (oldIndex < 0 || newIndex < 0) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  async function handleRename(category: Category, name: string) {
    setMessage("");
    if (name === category.name) return;

    const result = await renameCategory(category.id, name);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === category.id ? { ...item, name: name.trim() } : item,
      ),
    );
  }

  async function handleRemove(id: string) {
    setMessage("");
    const result = await removeCategory(id);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setItems((current) => current.filter((category) => category.id !== id));
  }

  return (
    <div className="max-w-md space-y-4 p-4">
      <form action={action} className="flex gap-2">
        <Input name="name" placeholder="새 카테고리 이름" />
        <Button type="submit" disabled={pending}>
          추가
        </Button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {message && <p className="text-sm text-red-600">{message}</p>}
      <div className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((category) => category.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {items.map((category) => (
                <SortableCategoryRow
                  key={category.id}
                  category={category}
                  choices={choicesByCategory[category.id] ?? []}
                  onRename={handleRename}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        {items.length > 0 && (
          <form action={saveCategorySortOrders} className="flex justify-end">
            {items.map((category) => (
              <input
                key={category.id}
                type="hidden"
                name="category_id"
                value={category.id}
              />
            ))}
            <Button type="submit">카테고리 순서 저장</Button>
          </form>
        )}
      </div>
    </div>
  );
}

function SortableCategoryRow({
  category,
  choices,
  onRename,
  onRemove,
}: {
  category: Category;
  choices: CategoryChoice[];
  onRename: (category: Category, name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`rounded border bg-white p-2 ${
        isDragging ? "relative z-10 opacity-70 shadow-sm" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`${category.name} 순서 변경 핸들`}
          className="flex size-11 cursor-grab touch-none items-center justify-center rounded text-gray-400 select-none hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" />
        </button>
        <Input
          defaultValue={category.name}
          className="flex-1"
          onBlur={(event) => onRename(category, event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRemove(category.id)}
        >
          삭제
        </Button>
      </div>
      <label className="mt-2 flex items-center gap-2 pl-11 text-sm text-gray-700">
        <input
          type="checkbox"
          defaultChecked={category.design_enabled}
          disabled={isPending}
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            startTransition(() => {
              void setCategoryDesignEnabled(category.id, checked);
            });
          }}
        />
        디자인 선택 사용
      </label>
      <CategoryChoiceManager categoryId={category.id} choices={choices} />
    </li>
  );
}
