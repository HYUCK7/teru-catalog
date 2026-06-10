# 상품 커스텀 주문 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 주문서에서 손님이 카테고리별 맛/옵션을 고르고(상품별 none/multi/single 방식), 일부 항목은 추가 금액이 붙으며, 선택 내역이 주문에 스냅샷으로 저장된다.

**Architecture:** `category_choices`(카테고리별 항목) 테이블 + `products.custom_type` + `orders.selected_choices(jsonb)`. 순수 로직은 `lib/customization.ts`, 데이터는 `lib/data/category-choices.ts`, 서버 동작은 `actions/*`, UI는 관리자(`CategoryChoiceManager`, `ProductForm`)와 손님(`ProductCustomizer`)으로 분리. 가격 변조 방지를 위해 서버에서 정식 항목 대조 후 스냅샷 재구성.

**Tech Stack:** Next.js 15 App Router(server actions), React 19, TypeScript, Supabase(@supabase/ssr, RLS), Tailwind v4, vitest.

**Test note:** 이 저장소는 Node 20.19+ 에서 테스트가 통과한다(기본 Node 18 실패). 명령은 `npm test` 또는 `npx vitest run <file>`.

---

### Task 1: 마이그레이션 0007 작성

**Files:**
- Create: `supabase/migrations/0007_customization.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
-- 상품 커스텀 주문: 카테고리별 맛/옵션 항목 + 상품 커스텀 방식 + 주문 선택 스냅샷

-- 카테고리별 맛/옵션 항목
create table category_choices (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  label text not null,
  price int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index on category_choices (category_id);

-- 상품 커스텀 방식: 'none' | 'multi' | 'single'
alter table products
  add column if not exists custom_type text not null default 'none';

-- 주문에 선택 항목 스냅샷 저장
alter table orders
  add column if not exists selected_choices jsonb not null default '[]'::jsonb;

-- RLS: 공개 읽기 / 관리자 쓰기
alter table category_choices enable row level security;

create policy "public read category_choices" on category_choices
  for select using (true);
create policy "admin write category_choices" on category_choices
  for all to authenticated using (true) with check (true);
```

- [ ] **Step 2: 적용 안내 메모**

이 마이그레이션은 사용자가 직접 적용한다(Supabase SQL Editor 또는 `supabase db push`). 적용 전에는 `/admin/categories`, 주문서, `/admin/orders`가 에러날 수 있음. 구현 중에는 적용되었다고 가정.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0007_customization.sql
git commit -m "feat: add customization migration (category_choices, custom_type, selected_choices)"
```

---

### Task 2: 타입 추가

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: `Product`에 `custom_type`, `Order`에 `selected_choices`, 새 타입 추가**

`Product` 타입에 필드 추가:

```typescript
export type CustomType = "none" | "multi" | "single";

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  description: string;
  is_visible: boolean;
  sort_order: number;
  custom_type: CustomType;
  created_at: string;
};
```

`Order` 타입에 필드 추가(`created_at` 위):

```typescript
  selected_choices: SelectedChoice[];
```

파일에 새 타입 추가:

```typescript
export type CategoryChoice = {
  id: string;
  category_id: string;
  label: string;
  price: number;
  sort_order: number;
  created_at: string;
};

export type SelectedChoice = {
  label: string;
  price: number;
};
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 기존 코드에서 `custom_type`/`selected_choices` 누락으로 에러가 날 수 있음 — 이후 Task에서 채워짐. 새 타입 자체에 문법 오류만 없으면 통과로 간주(에러가 신규 필드 관련인지만 확인).

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "feat: add customization types"
```

---

### Task 3: 순수 로직 `lib/customization.ts`

**Files:**
- Create: `lib/customization.ts`
- Test: `lib/customization.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
import { describe, expect, it } from "vitest";
import type { CategoryChoice } from "@/lib/supabase/types";
import {
  isCustomType,
  sumChoicePrice,
  validateSelectedChoices,
} from "./customization";

const choices: CategoryChoice[] = [
  { id: "a", category_id: "c", label: "딸기", price: 3000, sort_order: 0, created_at: "" },
  { id: "b", category_id: "c", label: "블루베리", price: 0, sort_order: 1, created_at: "" },
  { id: "d", category_id: "c", label: "초코", price: 2000, sort_order: 2, created_at: "" },
];

describe("isCustomType", () => {
  it("유효한 값만 true", () => {
    expect(isCustomType("none")).toBe(true);
    expect(isCustomType("multi")).toBe(true);
    expect(isCustomType("single")).toBe(true);
    expect(isCustomType("xxx")).toBe(false);
    expect(isCustomType("")).toBe(false);
  });
});

describe("validateSelectedChoices", () => {
  it("none 이면 선택이 있어도 빈 스냅샷", () => {
    const r = validateSelectedChoices("none", ["딸기"], choices);
    expect(r.ok).toBe(true);
    expect(r.snapshot).toEqual([]);
  });

  it("선택 없음은 허용(선택은 필수 아님)", () => {
    const r = validateSelectedChoices("multi", [], choices);
    expect(r.ok).toBe(true);
    expect(r.snapshot).toEqual([]);
  });

  it("multi 는 여러 개 선택 가능, 서버 데이터로 스냅샷 재구성", () => {
    const r = validateSelectedChoices("multi", ["딸기", "블루베리"], choices);
    expect(r.ok).toBe(true);
    expect(r.snapshot).toEqual([
      { label: "딸기", price: 3000 },
      { label: "블루베리", price: 0 },
    ]);
  });

  it("single 은 최대 1개", () => {
    const r = validateSelectedChoices("single", ["딸기", "초코"], choices);
    expect(r.ok).toBe(false);
  });

  it("single 1개는 허용", () => {
    const r = validateSelectedChoices("single", ["초코"], choices);
    expect(r.ok).toBe(true);
    expect(r.snapshot).toEqual([{ label: "초코", price: 2000 }]);
  });

  it("정식 항목에 없는 라벨은 에러", () => {
    const r = validateSelectedChoices("multi", ["없는맛"], choices);
    expect(r.ok).toBe(false);
  });

  it("중복 라벨은 한 번만", () => {
    const r = validateSelectedChoices("multi", ["딸기", "딸기"], choices);
    expect(r.ok).toBe(true);
    expect(r.snapshot).toEqual([{ label: "딸기", price: 3000 }]);
  });
});

describe("sumChoicePrice", () => {
  it("스냅샷 가격 합계", () => {
    expect(sumChoicePrice([{ label: "딸기", price: 3000 }, { label: "초코", price: 2000 }])).toBe(5000);
    expect(sumChoicePrice([])).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/customization.test.ts`
Expected: FAIL — `lib/customization.ts` 없음.

- [ ] **Step 3: 최소 구현**

```typescript
import type { CategoryChoice, CustomType, SelectedChoice } from "@/lib/supabase/types";

const CUSTOM_TYPES: CustomType[] = ["none", "multi", "single"];

export function isCustomType(value: string): value is CustomType {
  return (CUSTOM_TYPES as string[]).includes(value);
}

type Validation = { ok: true; snapshot: SelectedChoice[] } | { ok: false; error: string };

export function validateSelectedChoices(
  customType: CustomType,
  selectedLabels: string[],
  choices: CategoryChoice[],
): Validation {
  if (customType === "none") return { ok: true, snapshot: [] };

  // 중복 제거(입력 순서 유지)
  const unique = [...new Set(selectedLabels.map((l) => l.trim()).filter(Boolean))];

  if (customType === "single" && unique.length > 1) {
    return { ok: false, error: "옵션은 하나만 선택할 수 있어요." };
  }

  const byLabel = new Map(choices.map((c) => [c.label, c]));
  const snapshot: SelectedChoice[] = [];
  for (const label of unique) {
    const choice = byLabel.get(label);
    if (!choice) return { ok: false, error: "선택할 수 없는 항목이 있어요." };
    snapshot.push({ label: choice.label, price: choice.price });
  }

  return { ok: true, snapshot };
}

export function sumChoicePrice(snapshot: SelectedChoice[]): number {
  return snapshot.reduce((total, choice) => total + choice.price, 0);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/customization.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/customization.ts lib/customization.test.ts
git commit -m "feat: add customization pure logic (validate/snapshot/sum)"
```

---

### Task 4: 데이터 계층 `lib/data/category-choices.ts`

**Files:**
- Create: `lib/data/category-choices.ts`
- Test: `lib/data/category-choices.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
import { describe, expect, it, vi } from "vitest";
import { makeClient } from "@/test/mock-supabase";
import {
  addCategoryChoice,
  getChoicesByCategory,
  getChoicesForCategories,
  removeCategoryChoice,
  updateCategoryChoice,
} from "./category-choices";

describe("getChoicesByCategory", () => {
  it("해당 카테고리 항목을 반환한다", async () => {
    const client = makeClient({
      category_choices: {
        data: [
          { id: "1", category_id: "c", label: "딸기", price: 3000, sort_order: 0, created_at: "" },
        ],
        error: null,
      },
    });
    const rows = await getChoicesByCategory(client as never, "c");
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("딸기");
  });

  it("에러 시 throw", async () => {
    const client = makeClient({
      category_choices: { data: null, error: { message: "x" } },
    });
    await expect(getChoicesByCategory(client as never, "c")).rejects.toThrow("x");
  });
});

describe("getChoicesForCategories", () => {
  it("빈 배열이면 빈 객체", async () => {
    const from = vi.fn();
    const map = await getChoicesForCategories({ from } as never, []);
    expect(map).toEqual({});
    expect(from).not.toHaveBeenCalled();
  });

  it("category_id 별로 그룹핑한다", async () => {
    const client = makeClient({
      category_choices: {
        data: [
          { id: "1", category_id: "c1", label: "딸기", price: 0, sort_order: 0, created_at: "" },
          { id: "2", category_id: "c1", label: "초코", price: 0, sort_order: 1, created_at: "" },
          { id: "3", category_id: "c2", label: "2호", price: 5000, sort_order: 0, created_at: "" },
        ],
        error: null,
      },
    });
    const map = await getChoicesForCategories(client as never, ["c1", "c2"]);
    expect(map.c1).toHaveLength(2);
    expect(map.c2).toHaveLength(1);
  });
});

describe("addCategoryChoice", () => {
  it("insert 한다", async () => {
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    const client = { from: vi.fn(() => ({ insert })) };
    await addCategoryChoice(client as never, { categoryId: "c", label: "딸기", price: 3000, sortOrder: 0 });
    expect(insert).toHaveBeenCalledWith({
      category_id: "c",
      label: "딸기",
      price: 3000,
      sort_order: 0,
    });
  });
});

describe("updateCategoryChoice", () => {
  it("label/price 를 update 한다", async () => {
    const eq = vi.fn(() => Promise.resolve({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const client = { from: vi.fn(() => ({ update })) };
    await updateCategoryChoice(client as never, "1", { label: "블루베리", price: 1000 });
    expect(update).toHaveBeenCalledWith({ label: "블루베리", price: 1000 });
    expect(eq).toHaveBeenCalledWith("id", "1");
  });
});

describe("removeCategoryChoice", () => {
  it("delete 한다", async () => {
    const eq = vi.fn(() => Promise.resolve({ error: null }));
    const del = vi.fn(() => ({ eq }));
    const client = { from: vi.fn(() => ({ delete: del })) };
    await removeCategoryChoice(client as never, "1");
    expect(eq).toHaveBeenCalledWith("id", "1");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/data/category-choices.test.ts`
Expected: FAIL — 파일 없음.

- [ ] **Step 3: 최소 구현**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryChoice } from "@/lib/supabase/types";

export type CategoryChoiceWriteInput = {
  categoryId: string;
  label: string;
  price: number;
  sortOrder: number;
};

export async function getChoicesByCategory(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<CategoryChoice[]> {
  const { data, error } = await supabase
    .from("category_choices")
    .select("*")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryChoice[];
}

export async function getChoicesForCategories(
  supabase: SupabaseClient,
  categoryIds: string[],
): Promise<Record<string, CategoryChoice[]>> {
  if (categoryIds.length === 0) return {};

  const { data, error } = await supabase
    .from("category_choices")
    .select("*")
    .in("category_id", categoryIds)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const map: Record<string, CategoryChoice[]> = {};
  for (const row of (data ?? []) as CategoryChoice[]) {
    (map[row.category_id] ??= []).push(row);
  }
  return map;
}

export async function addCategoryChoice(
  supabase: SupabaseClient,
  input: CategoryChoiceWriteInput,
): Promise<void> {
  const { error } = await supabase.from("category_choices").insert({
    category_id: input.categoryId,
    label: input.label,
    price: input.price,
    sort_order: input.sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function updateCategoryChoice(
  supabase: SupabaseClient,
  id: string,
  fields: { label?: string; price?: number },
): Promise<void> {
  const { error } = await supabase
    .from("category_choices")
    .update(fields)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeCategoryChoice(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("category_choices")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getNextChoiceSortOrder(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<number> {
  const rows = await getChoicesByCategory(supabase, categoryId);
  return rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
}
```

> 참고: `makeQuery` mock 의 `select`/`eq`/`order`는 모두 같은 query 객체를 반환하고 `.then` 으로 resolve 되므로 `.in()` 도 동작하도록 mock 에 의존하지 않는다 — 위 `getChoicesForCategories` 테스트는 `makeClient` 가 `.in` 미지원이면 실패한다. **Step 3 직후 mock 확장이 필요하면 Step 3b 수행.**

- [ ] **Step 3b: (필요 시) mock 에 `.in` 추가**

`test/mock-supabase.ts` 의 `makeQuery` 에 한 줄 추가(이미 `eq`/`order` 와 동일 패턴):

```typescript
  query.in = vi.fn(chain);
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/data/category-choices.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/data/category-choices.ts lib/data/category-choices.test.ts test/mock-supabase.ts
git commit -m "feat: add category-choices data layer"
```

---

### Task 5: 카테고리 항목 서버 액션 `actions/category-choices.ts`

**Files:**
- Create: `actions/category-choices.ts`

- [ ] **Step 1: 액션 구현**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import {
  addCategoryChoice,
  getNextChoiceSortOrder,
  removeCategoryChoice,
  updateCategoryChoice,
} from "@/lib/data/category-choices";
import { createClient } from "@/lib/supabase/server";
import { MAX_INT_PRICE } from "@/lib/validation";

type Result = { ok: boolean; error?: string };

function parsePrice(value: FormDataEntryValue | null): number | null {
  const price = Number(value ?? 0);
  if (!Number.isInteger(price) || price < 0 || price > MAX_INT_PRICE) return null;
  return price;
}

export async function addChoiceAction(
  categoryId: string,
  _prev: unknown,
  formData: FormData,
): Promise<Result> {
  const label = String(formData.get("label") ?? "").trim();
  const price = parsePrice(formData.get("price"));
  if (!label) return { ok: false, error: "항목 이름을 입력하세요." };
  if (price === null) return { ok: false, error: "가격은 0 이상의 정수여야 합니다." };

  const supabase = await createClient();
  const sortOrder = await getNextChoiceSortOrder(supabase, categoryId);
  await addCategoryChoice(supabase, { categoryId, label, price, sortOrder });
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function updateChoiceAction(
  id: string,
  fields: { label: string; price: number },
): Promise<Result> {
  const label = fields.label.trim();
  if (!label) return { ok: false, error: "항목 이름을 입력하세요." };
  if (!Number.isInteger(fields.price) || fields.price < 0 || fields.price > MAX_INT_PRICE) {
    return { ok: false, error: "가격은 0 이상의 정수여야 합니다." };
  }
  const supabase = await createClient();
  await updateCategoryChoice(supabase, id, { label, price: fields.price });
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function removeChoiceAction(id: string): Promise<Result> {
  const supabase = await createClient();
  await removeCategoryChoice(supabase, id);
  revalidatePath("/admin/categories");
  return { ok: true };
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: PASS (이 파일 관련 에러 없음)

- [ ] **Step 3: Commit**

```bash
git add actions/category-choices.ts
git commit -m "feat: add category-choices server actions"
```

---

### Task 6: 관리자 카테고리 항목 관리 UI

**Files:**
- Create: `components/admin/CategoryChoiceManager.tsx`
- Modify: `components/admin/CategoryManager.tsx` (각 행에 항목 관리 삽입)
- Modify: `app/admin/categories/page.tsx` (항목 데이터 로드 + 전달)

- [ ] **Step 1: `CategoryChoiceManager` 작성**

```tsx
"use client";

import { useActionState, useState } from "react";
import {
  addChoiceAction,
  removeChoiceAction,
  updateChoiceAction,
} from "@/actions/category-choices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoryChoice } from "@/lib/supabase/types";

export function CategoryChoiceManager({
  categoryId,
  choices,
}: {
  categoryId: string;
  choices: CategoryChoice[];
}) {
  const action = addChoiceAction.bind(null, categoryId);
  const [state, formAction, pending] = useActionState(action, null);
  const [items, setItems] = useState(choices);
  const [message, setMessage] = useState("");

  // 추가 성공 시 서버 revalidate 로 새로고침되지만, 즉시 반영 위해 낙관적 처리는 생략(단순화).
  async function handleUpdate(choice: CategoryChoice, label: string, price: number) {
    setMessage("");
    if (label === choice.label && price === choice.price) return;
    const result = await updateChoiceAction(choice.id, { label, price });
    if (!result.ok) {
      setMessage(result.error ?? "수정 실패");
      return;
    }
    setItems((cur) => cur.map((i) => (i.id === choice.id ? { ...i, label, price } : i)));
  }

  async function handleRemove(id: string) {
    setMessage("");
    const result = await removeChoiceAction(id);
    if (!result.ok) {
      setMessage(result.error ?? "삭제 실패");
      return;
    }
    setItems((cur) => cur.filter((i) => i.id !== id));
  }

  return (
    <div className="mt-2 space-y-2 rounded bg-gray-50 p-2">
      <p className="text-xs font-medium text-gray-500">맛/옵션 항목</p>
      <ul className="space-y-1">
        {items.map((choice) => (
          <ChoiceRow key={choice.id} choice={choice} onUpdate={handleUpdate} onRemove={handleRemove} />
        ))}
      </ul>
      <form action={formAction} className="flex gap-1">
        <Input name="label" placeholder="항목 이름" className="flex-1" />
        <Input name="price" type="number" min={0} step={1} defaultValue={0} className="w-24" placeholder="추가금" />
        <Button type="submit" size="sm" disabled={pending}>추가</Button>
      </form>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}

function ChoiceRow({
  choice,
  onUpdate,
  onRemove,
}: {
  choice: CategoryChoice;
  onUpdate: (choice: CategoryChoice, label: string, price: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(choice.label);
  const [price, setPrice] = useState(String(choice.price));

  return (
    <li className="flex items-center gap-1">
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => onUpdate(choice, label.trim(), Number(price))}
        className="flex-1"
      />
      <Input
        type="number"
        min={0}
        step={1}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={() => onUpdate(choice, label.trim(), Number(price))}
        className="w-24"
      />
      <Button type="button" variant="outline" size="sm" onClick={() => onRemove(choice.id)}>
        삭제
      </Button>
    </li>
  );
}
```

- [ ] **Step 2: `CategoryManager` 에 항목 관리 삽입**

`CategoryManager` props 에 `choicesByCategory` 추가하고 `SortableCategoryRow` 에 전달:

`components/admin/CategoryManager.tsx` 상단 import 추가:

```typescript
import { CategoryChoiceManager } from "@/components/admin/CategoryChoiceManager";
import type { Category, CategoryChoice } from "@/lib/supabase/types";
```

(기존 `import type { Category } ...` 줄을 위 줄로 교체)

`CategoryManager` 시그니처 변경:

```typescript
export function CategoryManager({
  categories,
  choicesByCategory,
}: {
  categories: Category[];
  choicesByCategory: Record<string, CategoryChoice[]>;
}) {
```

`SortableCategoryRow` 렌더에 prop 전달:

```tsx
                <SortableCategoryRow
                  key={category.id}
                  category={category}
                  choices={choicesByCategory[category.id] ?? []}
                  onRename={handleRename}
                  onRemove={handleRemove}
                />
```

`SortableCategoryRow` 시그니처 + 렌더 수정 — `choices` prop 받고, 행 하단에 매니저 추가:

```tsx
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
```

`<li>` 내부를 두 영역으로 감싼다. 기존 `<li>` 의 자식(핸들/이름/삭제 버튼)을 `<div className="flex items-center gap-2">` 로 묶고, 그 아래 `<CategoryChoiceManager categoryId={category.id} choices={choices} />` 를 추가. `<li>` 의 className 은 `flex items-center` 대신 `block` 계열로 변경:

```tsx
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded border bg-white p-2 ${isDragging ? "relative z-10 opacity-70 shadow-sm" : ""}`}
    >
      <div className="flex items-center gap-2">
        <input type="hidden" name="category_id" value={category.id} />
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
        <Button type="button" variant="outline" size="sm" onClick={() => onRemove(category.id)}>
          삭제
        </Button>
      </div>
      <CategoryChoiceManager categoryId={category.id} choices={choices} />
    </li>
```

- [ ] **Step 3: 카테고리 페이지에서 항목 로드 + 전달**

`app/admin/categories/page.tsx` 전체 교체:

```tsx
import { AdminNav } from "@/components/admin/AdminNav";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { getCategories } from "@/lib/data/categories";
import { getChoicesForCategories } from "@/lib/data/category-choices";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase);
  const choicesByCategory = await getChoicesForCategories(
    supabase,
    categories.map((c) => c.id),
  );

  return (
    <div>
      <AdminNav />
      <h1 className="p-4 text-xl font-bold">카테고리 관리</h1>
      <CategoryManager categories={categories} choicesByCategory={choicesByCategory} />
    </div>
  );
}
```

- [ ] **Step 4: 타입체크 + 빌드**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/admin/CategoryChoiceManager.tsx components/admin/CategoryManager.tsx app/admin/categories/page.tsx
git commit -m "feat: manage category choices in admin"
```

---

### Task 7: 상품 데이터 + 액션에 `custom_type` 반영

**Files:**
- Modify: `lib/data/products.ts` (`ProductWriteInput`, create/update)
- Modify: `actions/products.ts` (폼에서 custom_type 읽기)

- [ ] **Step 1: `ProductWriteInput` + create/update 수정**

`lib/data/products.ts` — `ProductWriteInput` 에 필드 추가:

```typescript
import type {
  CustomType,
  Product,
  ProductImage,
  ProductWithImages,
} from "@/lib/supabase/types";

export type ProductWriteInput = {
  name: string;
  price: number;
  categoryId: string;
  description: string;
  isVisible: boolean;
  customType: CustomType;
};
```

`createProduct` 의 `.insert({...})` 에 추가: `custom_type: input.customType,`
`updateProduct` 의 `.update({...})` 에 추가: `custom_type: input.customType,`

- [ ] **Step 2: `actions/products.ts` 에서 custom_type 파싱**

`saveProduct` 안에서 폼 읽기 추가:

```typescript
  const isVisible = formData.get("is_visible") === "on";
  const customEnabled = formData.get("custom_enabled") === "on";
  const customTypeRaw = String(formData.get("custom_type") ?? "multi");
  const customType: CustomType = customEnabled && isCustomType(customTypeRaw)
    ? (customTypeRaw as CustomType)
    : "none";
```

`input` 객체에 `customType` 추가:

```typescript
  const input = { name, price, categoryId, description, isVisible, customType };
```

파일 상단 import 추가:

```typescript
import { isCustomType } from "@/lib/customization";
import type { CustomType } from "@/lib/supabase/types";
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/data/products.ts actions/products.ts
git commit -m "feat: persist product custom_type"
```

---

### Task 8: 상품 폼 커스텀 UI

**Files:**
- Modify: `components/admin/ProductForm.tsx`

- [ ] **Step 1: `노출하기` 아래에 커스텀 섹션 추가**

`노출하기` `<label>` 블록과 `<Button type="submit">` 사이에 삽입. 상태로 체크 여부 관리:

상단 `useState` 는 이미 import 됨. 컴포넌트 본문 상단에 추가:

```typescript
  const [customEnabled, setCustomEnabled] = useState(
    (product?.custom_type ?? "none") !== "none",
  );
```

JSX 삽입:

```tsx
      <div className="space-y-2 rounded border p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="custom_enabled"
            checked={customEnabled}
            onChange={(e) => setCustomEnabled(e.target.checked)}
          />
          커스텀 주문 받기
        </label>
        {customEnabled && (
          <div className="space-y-1 pl-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="custom_type"
                value="multi"
                defaultChecked={(product?.custom_type ?? "multi") !== "single"}
              />
              맛 선택 · 여러 개 선택 가능
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="custom_type"
                value="single"
                defaultChecked={product?.custom_type === "single"}
              />
              옵션 선택 · 하나만 선택
            </label>
            <p className="text-xs text-gray-500">
              맛/옵션 항목은 [카테고리 관리]에서 등록·수정합니다.
            </p>
          </div>
        )}
      </div>
```

- [ ] **Step 2: 타입체크 + 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/admin/ProductForm.tsx
git commit -m "feat: add customization controls to product form"
```

---

### Task 9: 주문 저장에 선택 항목 반영

**Files:**
- Modify: `lib/data/orders.ts` (`OrderWriteInput`, insert)
- Modify: `actions/orders.ts` (선택 항목 검증 + 스냅샷)

- [ ] **Step 1: `OrderWriteInput` + insert 수정**

`lib/data/orders.ts`:

```typescript
import type { Order, SelectedChoice } from "@/lib/supabase/types";
```

`OrderWriteInput` 에 추가:

```typescript
  selectedChoices: SelectedChoice[];
```

`createOrder` 의 `.insert({...})` 에 추가: `selected_choices: input.selectedChoices,`

- [ ] **Step 2: `actions/orders.ts` 에서 검증 + 스냅샷 생성**

상단 import 추가:

```typescript
import { validateSelectedChoices } from "@/lib/customization";
import { getChoicesByCategory } from "@/lib/data/category-choices";
```

폼 읽기(다른 `formData.get` 들과 함께):

```typescript
  const selectedLabels = formData.getAll("selected_choice").map(String);
```

`getProductWithImages` 로 product 를 얻은 뒤(이미 존재), 그 아래에 검증 추가:

```typescript
  let selectedChoices: { label: string; price: number }[] = [];
  if (product.custom_type !== "none" && product.category_id) {
    const choices = await getChoicesByCategory(supabase, product.category_id);
    const result = validateSelectedChoices(product.custom_type, selectedLabels, choices);
    if (!result.ok) {
      return { ok: false, errors: { choices: result.error } };
    }
    selectedChoices = result.snapshot;
  }
```

`createOrder` 호출에 추가: `selectedChoices,`

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: 전체 테스트**

Run: `npm test`
Expected: PASS (기존 + 신규 통과)

- [ ] **Step 5: Commit**

```bash
git add lib/data/orders.ts actions/orders.ts
git commit -m "feat: validate and store selected choices on order"
```

---

### Task 10: 손님 주문서 커스터마이저

**Files:**
- Create: `components/customer/ProductCustomizer.tsx`
- Modify: `components/customer/OrderForm.tsx` (커스터마이저 렌더 + props)
- Modify: `app/(customer)/products/[id]/order/page.tsx` (카테고리 항목 로드 + 전달)

- [ ] **Step 1: `ProductCustomizer` 작성**

```tsx
"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { sumChoicePrice } from "@/lib/customization";
import type { CategoryChoice, CustomType } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function ProductCustomizer({
  customType,
  choices,
  basePrice,
  error,
}: {
  customType: CustomType;
  choices: CategoryChoice[];
  basePrice: number;
  error?: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  if (customType === "none" || choices.length === 0) return null;

  function toggle(label: string) {
    if (customType === "single") {
      setSelected((cur) => (cur[0] === label ? [] : [label]));
      return;
    }
    setSelected((cur) =>
      cur.includes(label) ? cur.filter((l) => l !== label) : [...cur, label],
    );
  }

  const snapshot = selected
    .map((label) => choices.find((c) => c.label === label))
    .filter((c): c is CategoryChoice => Boolean(c))
    .map((c) => ({ label: c.label, price: c.price }));
  const extra = sumChoicePrice(snapshot);

  return (
    <div>
      <Label>{customType === "single" ? "옵션 선택" : "맛 선택 (여러 개 가능)"}</Label>
      {selected.map((label) => (
        <input key={label} type="hidden" name="selected_choice" value={label} />
      ))}
      <div className="mt-1 grid grid-cols-2 gap-2">
        {choices.map((choice) => {
          const active = selected.includes(choice.label);
          return (
            <button
              key={choice.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(choice.label)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              <span className="font-medium">{choice.label}</span>
              {choice.price > 0 && (
                <span className="ml-1 text-xs opacity-80">
                  (+{choice.price.toLocaleString()}원)
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-sm text-gray-600">
        추가 금액 +{extra.toLocaleString()}원 · 예상 합계{" "}
        {(basePrice + extra).toLocaleString()}원
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: `OrderForm` 에 커스터마이저 연결**

`OrderForm` props 변경 + import:

```typescript
import { ProductCustomizer } from "@/components/customer/ProductCustomizer";
import type { CategoryChoice, Product } from "@/lib/supabase/types";
```

```typescript
export function OrderForm({
  product,
  choices,
  closedWeekdays,
  closedDates,
  blockedByDate,
}: {
  product: Product;
  choices: CategoryChoice[];
  closedWeekdays: number[];
  closedDates: string[];
  blockedByDate: Record<string, string[]>;
}) {
```

`수량` 블록과 `<PickupScheduler>` 사이에 삽입:

```tsx
      <ProductCustomizer
        customType={product.custom_type}
        choices={choices}
        basePrice={product.price}
        error={state?.errors?.choices}
      />
```

- [ ] **Step 3: 주문 페이지에서 카테고리 항목 로드 + 전달**

`app/(customer)/products/[id]/order/page.tsx`:

import 추가:

```typescript
import { getChoicesByCategory } from "@/lib/data/category-choices";
```

product 조회 후, `Promise.all` 에 항목 조회 추가(또는 별도 await). product 의 category_id 가 있고 custom_type !== "none" 일 때만 로드:

```typescript
  const choices =
    product.category_id && product.custom_type !== "none"
      ? await getChoicesByCategory(supabase, product.category_id)
      : [];
```

`<OrderForm>` 에 `choices={choices}` 추가.

- [ ] **Step 4: 타입체크 + 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/customer/ProductCustomizer.tsx components/customer/OrderForm.tsx "app/(customer)/products/[id]/order/page.tsx"
git commit -m "feat: customer customization picker on order form"
```

---

### Task 11: 관리자 주문 목록에 선택 항목 표시

**Files:**
- Modify: `components/admin/OrderList.tsx`

- [ ] **Step 1: 선택 항목 표시 추가**

`레터링` `<p>` 위 또는 아래에 삽입(요청 메모 위가 적절):

```tsx
              {order.selected_choices.length > 0 && (
                <p>
                  선택:{" "}
                  {order.selected_choices
                    .map((c) =>
                      c.price > 0
                        ? `${c.label}(+${c.price.toLocaleString()}원)`
                        : c.label,
                    )
                    .join(", ")}
                </p>
              )}
```

- [ ] **Step 2: 타입체크 + 빌드 + 테스트**

Run: `npx tsc --noEmit && npm run build && npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/admin/OrderList.tsx
git commit -m "feat: show selected choices in admin order list"
```

---

## 마무리 확인
- [ ] 마이그레이션 `0007_customization.sql` 적용 안내(사용자 직접 적용).
- [ ] `npm test` 전체 통과, `npm run build` 통과.
- [ ] 수동 확인: 카테고리 항목 추가/수정/삭제 → 상품 폼 커스텀 체크 → 주문서에서 선택·가격 합계 → `/admin/orders` 선택 항목 표시.
