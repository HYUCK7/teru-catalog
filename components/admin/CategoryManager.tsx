"use client";

import { useActionState, useState } from "react";
import type { Category } from "@/lib/supabase/types";
import {
  addCategory,
  removeCategory,
  renameCategory,
} from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(addCategory, null);
  const [message, setMessage] = useState("");

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
      <ul className="space-y-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center gap-2 rounded border p-2"
          >
            <Input
              defaultValue={category.name}
              className="flex-1"
              onBlur={async (event) => {
                setMessage("");
                if (event.target.value !== category.name) {
                  const result = await renameCategory(
                    category.id,
                    event.target.value,
                  );
                  if (!result.ok) setMessage(result.error);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                setMessage("");
                const result = await removeCategory(category.id);
                if (!result.ok) setMessage(result.error);
              }}
            >
              삭제
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
