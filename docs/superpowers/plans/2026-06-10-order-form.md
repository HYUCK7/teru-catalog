# 주문하기 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 손님이 상품 상세에서 주문서를 작성하면 주문이 Supabase `orders` 테이블에 저장되고, 관리자 화면에서 목록 확인 및 완료 체크가 가능하게 한다.

**Architecture:** 기존 패턴(`lib/data/*` 순수 데이터 함수 → `actions/*` 서버액션 → `lib/validation.ts` 검증, RLS는 공개 읽기·인증 쓰기)을 그대로 따른다. `orders`는 예외적으로 **공개 INSERT / 관리자 SELECT·UPDATE·DELETE** RLS를 쓴다. 단일 상품 주문, 장바구니 없음, 픽업 전용.

**Tech Stack:** Next.js 15 (App Router, RSC + server actions), React 19 (`useActionState`), Supabase, TypeScript, Tailwind, vitest.

---

## 참고: 테스트 실행 환경

`npm test`는 **Node 20.19+** 가 필요하다 (기본 Node 18로는 실패). 테스트 단계 전에 Node 버전을 확인할 것.

## 파일 구조

생성:
- `supabase/migrations/0005_orders.sql` — orders 테이블 + 인덱스 + RLS
- `lib/data/orders.ts` — `createOrder`, `getOrders`, `setOrderDone`
- `lib/data/orders.test.ts` — 데이터 함수 단위 테스트
- `actions/orders.ts` — `submitOrder`, `toggleOrderDone`
- `components/customer/OrderForm.tsx` — 손님 주문서 폼(클라이언트)
- `components/admin/OrderList.tsx` — 관리자 주문 목록 + 완료 토글(클라이언트)
- `app/(customer)/products/[id]/order/page.tsx` — 주문서 페이지(서버)
- `app/(customer)/order/complete/page.tsx` — 접수완료 안내(서버)
- `app/admin/orders/page.tsx` — 관리자 주문 페이지(서버)

수정:
- `lib/supabase/types.ts` — `Order` 타입 추가
- `lib/validation.ts` — `validateOrderInput` 추가
- `lib/validation.test.ts` — `validateOrderInput` 케이스 추가
- `app/(customer)/products/[id]/page.tsx` — 「주문하기」 버튼 추가
- `components/admin/AdminNav.tsx` — "주문" 링크 추가

---

## Task 1: orders 테이블 마이그레이션

**Files:**
- Create: `supabase/migrations/0005_orders.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

`supabase/migrations/0005_orders.sql`:

```sql
-- 주문 (단일 상품, 픽업 전용)
create table orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity int not null default 1,
  customer_name text not null,
  phone text not null,
  pickup_date date not null,
  pickup_time text not null,
  lettering text not null default '',
  request_memo text not null default '',
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index on orders (created_at desc);

-- RLS: 공개 생성 / 관리자 조회·수정·삭제
alter table orders enable row level security;

create policy "public insert orders" on orders for insert
  to anon, authenticated with check (true);
create policy "admin read orders" on orders for select
  to authenticated using (true);
create policy "admin update orders" on orders for update
  to authenticated using (true) with check (true);
create policy "admin delete orders" on orders for delete
  to authenticated using (true);
```

- [ ] **Step 2: 마이그레이션 적용**

기존 마이그레이션과 동일한 방식으로 Supabase에 적용한다 (Supabase 대시보드 SQL Editor에 위 SQL 붙여넣어 실행, 또는 `supabase db push`). 적용 후 Table Editor에서 `orders` 테이블과 4개 정책이 보이는지 확인.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0005_orders.sql
git commit -m "feat: orders 테이블 마이그레이션 추가"
```

---

## Task 2: Order 타입 추가

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Order 타입 추가**

`lib/supabase/types.ts` 파일 끝에 추가:

```typescript
export type Order = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  customer_name: string;
  phone: string;
  pickup_date: string;
  pickup_time: string;
  lettering: string;
  request_memo: string;
  is_done: boolean;
  created_at: string;
};
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (또는 기존과 동일한 상태)

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "feat: Order 타입 추가"
```

---

## Task 3: validateOrderInput 검증 함수

**Files:**
- Modify: `lib/validation.ts`
- Test: `lib/validation.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/validation.test.ts` 에 추가 (기존 `import` 에 `validateOrderInput` 추가). 파일 상단 import 예시:

```typescript
import {
  validateOrderInput,
} from "./validation";
```

> 주의: `lib/validation.test.ts` 가 이미 존재하면 기존 import 라인에 `validateOrderInput` 만 추가하고, 없으면 다음 전체를 새로 만든다.

테스트 본문 추가:

```typescript
describe("validateOrderInput", () => {
  const valid = {
    customerName: "홍길동",
    phone: "010-1234-5678",
    quantity: 1,
    pickupDate: "2026-06-20",
    pickupTime: "14:00",
  };

  it("정상 입력이면 ok", () => {
    expect(validateOrderInput(valid).ok).toBe(true);
  });

  it("이름이 비면 에러", () => {
    const result = validateOrderInput({ ...valid, customerName: "  " });
    expect(result.ok).toBe(false);
    expect(result.errors.customerName).toBeTruthy();
  });

  it("연락처가 비면 에러", () => {
    const result = validateOrderInput({ ...valid, phone: "" });
    expect(result.errors.phone).toBeTruthy();
  });

  it("수량이 0 이하 또는 소수면 에러", () => {
    expect(validateOrderInput({ ...valid, quantity: 0 }).errors.quantity).toBeTruthy();
    expect(validateOrderInput({ ...valid, quantity: -1 }).errors.quantity).toBeTruthy();
    expect(validateOrderInput({ ...valid, quantity: 1.5 }).errors.quantity).toBeTruthy();
  });

  it("픽업 날짜/시간이 비면 에러", () => {
    expect(validateOrderInput({ ...valid, pickupDate: "" }).errors.pickupDate).toBeTruthy();
    expect(validateOrderInput({ ...valid, pickupTime: "" }).errors.pickupTime).toBeTruthy();
  });
});
```

기존 `lib/validation.test.ts` 가 없을 경우 파일 맨 위에 추가:

```typescript
import { describe, expect, it } from "vitest";
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/validation.test.ts`
Expected: FAIL — `validateOrderInput is not a function`

- [ ] **Step 3: 검증 함수 구현**

`lib/validation.ts` 끝에 추가:

```typescript
export function validateOrderInput(input: {
  customerName: string;
  phone: string;
  quantity: number;
  pickupDate: string;
  pickupTime: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.customerName.trim()) errors.customerName = "주문자 이름을 입력하세요.";
  if (!input.phone.trim()) errors.phone = "연락처를 입력하세요.";
  if (
    !Number.isFinite(input.quantity) ||
    !Number.isInteger(input.quantity) ||
    input.quantity < 1
  ) {
    errors.quantity = "수량은 1개 이상이어야 합니다.";
  }
  if (!input.pickupDate.trim()) errors.pickupDate = "픽업 날짜를 선택하세요.";
  if (!input.pickupTime.trim()) errors.pickupTime = "픽업 시간을 선택하세요.";

  return Object.keys(errors).length ? fail(errors) : ok();
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts lib/validation.test.ts
git commit -m "feat: validateOrderInput 검증 함수 추가"
```

---

## Task 4: orders 데이터 접근 함수

**Files:**
- Create: `lib/data/orders.ts`
- Test: `lib/data/orders.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/data/orders.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { makeClient } from "@/test/mock-supabase";
import { createOrder, getOrders, setOrderDone } from "./orders";

function insertClient(
  returnRow: unknown,
  error: { message: string } | null = null,
) {
  const single = vi.fn(() => Promise.resolve({ data: returnRow, error }));
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));
  return { client: { from }, insert };
}

function updateClient(error: { message: string } | null = null) {
  const eq = vi.fn(() => Promise.resolve({ error }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return { client: { from }, update, eq };
}

const input = {
  productId: "p1",
  productName: "딸기 케이크",
  quantity: 2,
  customerName: "홍길동",
  phone: "010-1234-5678",
  pickupDate: "2026-06-20",
  pickupTime: "14:00",
  lettering: "생일축하해",
  requestMemo: "초 5개",
};

describe("createOrder", () => {
  it("orders 테이블에 insert 하고 생성된 행을 반환한다", async () => {
    const { client, insert } = insertClient({ id: "o1", product_name: "딸기 케이크" });
    const row = await createOrder(client as never, input);
    expect(insert).toHaveBeenCalled();
    expect(row.id).toBe("o1");
  });

  it("에러 시 throw", async () => {
    const { client } = insertClient(null, { message: "fail" });
    await expect(createOrder(client as never, input)).rejects.toThrow("fail");
  });
});

describe("getOrders", () => {
  it("주문 목록을 반환한다", async () => {
    const client = makeClient({
      orders: { data: [{ id: "o1", product_name: "딸기 케이크" }], error: null },
    });
    const rows = await getOrders(client as never);
    expect(rows).toHaveLength(1);
    expect(client.from).toHaveBeenCalledWith("orders");
  });

  it("에러 시 throw", async () => {
    const client = makeClient({
      orders: { data: null, error: { message: "boom" } },
    });
    await expect(getOrders(client as never)).rejects.toThrow("boom");
  });
});

describe("setOrderDone", () => {
  it("is_done 를 update 한다", async () => {
    const { client, update, eq } = updateClient();
    await setOrderDone(client as never, "o1", true);
    expect(update).toHaveBeenCalledWith({ is_done: true });
    expect(eq).toHaveBeenCalledWith("id", "o1");
  });

  it("에러 시 throw", async () => {
    const { client } = updateClient({ message: "nope" });
    await expect(setOrderDone(client as never, "o1", true)).rejects.toThrow("nope");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/data/orders.test.ts`
Expected: FAIL — `./orders` 모듈/함수 없음

- [ ] **Step 3: 데이터 함수 구현**

`lib/data/orders.ts`:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "@/lib/supabase/types";

export type OrderWriteInput = {
  productId: string;
  productName: string;
  quantity: number;
  customerName: string;
  phone: string;
  pickupDate: string;
  pickupTime: string;
  lettering: string;
  requestMemo: string;
};

export async function createOrder(
  supabase: SupabaseClient,
  input: OrderWriteInput,
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      product_id: input.productId,
      product_name: input.productName,
      quantity: input.quantity,
      customer_name: input.customerName,
      phone: input.phone,
      pickup_date: input.pickupDate,
      pickup_time: input.pickupTime,
      lettering: input.lettering,
      request_memo: input.requestMemo,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as Order;
}

export async function getOrders(supabase: SupabaseClient): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as Order[];
}

export async function setOrderDone(
  supabase: SupabaseClient,
  id: string,
  isDone: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ is_done: isDone })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/data/orders.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/data/orders.ts lib/data/orders.test.ts
git commit -m "feat: orders 데이터 접근 함수 추가"
```

---

## Task 5: orders 서버액션

**Files:**
- Create: `actions/orders.ts`

- [ ] **Step 1: 서버액션 구현**

`actions/orders.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createOrder, setOrderDone } from "@/lib/data/orders";
import { getProductWithImages } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";
import { validateOrderInput } from "@/lib/validation";

type SubmitResult = { ok: boolean; errors: Record<string, string> };

export async function submitOrder(
  productId: string,
  _prev: unknown,
  formData: FormData,
): Promise<SubmitResult> {
  const customerName = String(formData.get("customer_name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const pickupDate = String(formData.get("pickup_date") ?? "");
  const pickupTime = String(formData.get("pickup_time") ?? "");
  const lettering = String(formData.get("lettering") ?? "");
  const requestMemo = String(formData.get("request_memo") ?? "");

  const validation = validateOrderInput({
    customerName,
    phone,
    quantity,
    pickupDate,
    pickupTime,
  });
  if (!validation.ok) return { ok: false, errors: validation.errors };

  const supabase = await createClient();
  const product = await getProductWithImages(supabase, productId);
  if (!product) {
    return { ok: false, errors: { product: "상품을 찾을 수 없습니다." } };
  }

  await createOrder(supabase, {
    productId,
    productName: product.name,
    quantity,
    customerName,
    phone,
    pickupDate,
    pickupTime,
    lettering,
    requestMemo,
  });

  redirect("/order/complete");
}

export async function toggleOrderDone(id: string, isDone: boolean) {
  const supabase = await createClient();
  await setOrderDone(supabase, id, isDone);
  revalidatePath("/admin/orders");
}
```

> 참고: `redirect()` 는 내부적으로 throw 하므로 `submitOrder` 가 성공 시 `SubmitResult` 를 반환하지 않고 리다이렉트된다. 반환 타입은 검증 실패 케이스를 위한 것.

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add actions/orders.ts
git commit -m "feat: submitOrder / toggleOrderDone 서버액션 추가"
```

---

## Task 6: 손님 주문서 폼 컴포넌트

**Files:**
- Create: `components/customer/OrderForm.tsx`

- [ ] **Step 1: OrderForm 구현**

`components/customer/OrderForm.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { submitOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/supabase/types";

export function OrderForm({ product }: { product: Product }) {
  const action = submitOrder.bind(null, product.id);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4 p-4">
      <div className="rounded border p-3">
        <p className="font-bold">{product.name}</p>
        <p className="text-sm text-gray-600">
          {product.price.toLocaleString()}원
        </p>
      </div>

      <div>
        <Label htmlFor="customer_name">주문자 이름</Label>
        <Input id="customer_name" name="customer_name" />
        {state?.errors?.customerName && (
          <p className="text-sm text-red-600">{state.errors.customerName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">연락처</Label>
        <Input id="phone" name="phone" type="tel" inputMode="tel" />
        {state?.errors?.phone && (
          <p className="text-sm text-red-600">{state.errors.phone}</p>
        )}
      </div>

      <div>
        <Label htmlFor="quantity">수량</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          step={1}
          defaultValue={1}
        />
        {state?.errors?.quantity && (
          <p className="text-sm text-red-600">{state.errors.quantity}</p>
        )}
      </div>

      <div>
        <Label htmlFor="pickup_date">픽업 날짜</Label>
        <Input id="pickup_date" name="pickup_date" type="date" />
        {state?.errors?.pickupDate && (
          <p className="text-sm text-red-600">{state.errors.pickupDate}</p>
        )}
      </div>

      <div>
        <Label htmlFor="pickup_time">픽업 시간</Label>
        <Input id="pickup_time" name="pickup_time" type="time" />
        {state?.errors?.pickupTime && (
          <p className="text-sm text-red-600">{state.errors.pickupTime}</p>
        )}
      </div>

      <div>
        <Label htmlFor="lettering">레터링 문구 (선택)</Label>
        <Input id="lettering" name="lettering" />
      </div>

      <div>
        <Label htmlFor="request_memo">추가 요청사항 (선택)</Label>
        <Textarea id="request_memo" name="request_memo" />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "접수 중..." : "주문 접수하기"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add components/customer/OrderForm.tsx
git commit -m "feat: 손님 주문서 폼 컴포넌트 추가"
```

---

## Task 7: 주문서 페이지 + 접수완료 페이지

**Files:**
- Create: `app/(customer)/products/[id]/order/page.tsx`
- Create: `app/(customer)/order/complete/page.tsx`

- [ ] **Step 1: 주문서 페이지 구현**

`app/(customer)/products/[id]/order/page.tsx`:

```tsx
import { BackButton } from "@/components/BackButton";
import { OrderForm } from "@/components/customer/OrderForm";
import { getProductWithImages } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await getProductWithImages(supabase, id);

  if (!product || !product.is_visible) notFound();

  return (
    <main className="mx-auto max-w-md pb-8">
      <div className="p-4">
        <BackButton label="뒤로" />
      </div>
      <h1 className="px-4 text-lg font-bold">주문서</h1>
      <OrderForm product={product} />
    </main>
  );
}
```

- [ ] **Step 2: 접수완료 페이지 구현**

`app/(customer)/order/complete/page.tsx`:

```tsx
import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderCompletePage() {
  const supabase = await createClient();
  const settings = await getSettings(supabase);

  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="my-4 text-xl font-bold">주문이 접수되었습니다</h1>
      <p className="text-gray-600">확인 후 연락드리겠습니다. 감사합니다!</p>
      <div className="mt-8 space-y-2">
        {settings.kakao_channel_url && (
          <a
            href={settings.kakao_channel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded bg-black py-3 text-white"
          >
            카카오로 문의하기
          </a>
        )}
        <Link href="/menu" className="block rounded border py-3">
          메뉴로 돌아가기
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 타입체크 + 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add "app/(customer)/products/[id]/order/page.tsx" "app/(customer)/order/complete/page.tsx"
git commit -m "feat: 주문서 페이지 및 접수완료 페이지 추가"
```

---

## Task 8: 상품 상세에 「주문하기」 버튼 추가

**Files:**
- Modify: `app/(customer)/products/[id]/page.tsx`

- [ ] **Step 1: Link import 추가 및 버튼 삽입**

`app/(customer)/products/[id]/page.tsx` 상단 import에 `Link` 추가:

```tsx
import Link from "next/link";
```

그리고 기존의

```tsx
        <div className="pt-4">
          <ContactButtons settings={settings} />
        </div>
```

부분을 다음으로 교체:

```tsx
        <div className="space-y-2 pt-4">
          <Link
            href={`/products/${product.id}/order`}
            className="block rounded bg-black py-3 text-center text-white"
          >
            주문하기
          </Link>
          <ContactButtons settings={settings} />
        </div>
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add "app/(customer)/products/[id]/page.tsx"
git commit -m "feat: 상품 상세에 주문하기 버튼 추가"
```

---

## Task 9: 관리자 주문 목록 컴포넌트

**Files:**
- Create: `components/admin/OrderList.tsx`

- [ ] **Step 1: OrderList 구현**

`components/admin/OrderList.tsx`:

```tsx
"use client";

import { toggleOrderDone } from "@/actions/orders";
import type { Order } from "@/lib/supabase/types";

export function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="p-4 text-gray-500">주문이 없습니다.</p>;
  }

  return (
    <ul className="space-y-3 p-4">
      {orders.map((order) => (
        <li
          key={order.id}
          className={`rounded border p-4 ${order.is_done ? "opacity-50" : ""}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 text-sm">
              <p className="font-bold">
                {order.product_name} × {order.quantity}
              </p>
              <p>
                주문자: {order.customer_name} ({order.phone})
              </p>
              <p>
                픽업: {order.pickup_date} {order.pickup_time}
              </p>
              {order.lettering && <p>레터링: {order.lettering}</p>}
              {order.request_memo && <p>요청: {order.request_memo}</p>}
              <p className="text-gray-400">
                {new Date(order.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleOrderDone(order.id, !order.is_done)}
              className={`shrink-0 rounded px-3 py-1 text-sm ${
                order.is_done ? "bg-gray-200" : "bg-black text-white"
              }`}
            >
              {order.is_done ? "완료됨" : "완료"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add components/admin/OrderList.tsx
git commit -m "feat: 관리자 주문 목록 컴포넌트 추가"
```

---

## Task 10: 관리자 주문 페이지 + 네비 링크

**Files:**
- Create: `app/admin/orders/page.tsx`
- Modify: `components/admin/AdminNav.tsx`

- [ ] **Step 1: 관리자 주문 페이지 구현**

`app/admin/orders/page.tsx`:

```tsx
import { AdminNav } from "@/components/admin/AdminNav";
import { OrderList } from "@/components/admin/OrderList";
import { getOrders } from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const orders = await getOrders(supabase);

  return (
    <div>
      <AdminNav />
      <h1 className="p-4 text-xl font-bold">주문 관리</h1>
      <OrderList orders={orders} />
    </div>
  );
}
```

- [ ] **Step 2: AdminNav 에 "주문" 링크 추가**

`components/admin/AdminNav.tsx` 의

```tsx
      <Link href="/admin/products">상품</Link>
```

바로 아래에 추가:

```tsx
      <Link href="/admin/orders">주문</Link>
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add app/admin/orders/page.tsx components/admin/AdminNav.tsx
git commit -m "feat: 관리자 주문 페이지 및 네비 링크 추가"
```

---

## Task 11: 전체 검증

- [ ] **Step 1: 전체 테스트 실행**

Run: `npm test`
Expected: 전체 PASS (Node 20.19+ 필요)

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공, `/products/[id]/order`, `/order/complete`, `/admin/orders` 라우트 생성됨

- [ ] **Step 3: 수동 동작 확인 (dev 서버)**

Run: `npm run dev`
확인 항목:
1. 상품 상세 페이지에 「주문하기」 버튼이 보인다.
2. 주문서 작성 → 필수 항목 비우고 제출 시 필드별 에러 표시.
3. 정상 입력 후 제출 → `/order/complete` 접수완료 페이지로 이동.
4. `/admin/orders` 에서 방금 넣은 주문이 최신순 맨 위에 보인다.
5. 「완료」 버튼 클릭 → 흐리게 처리되고 "완료됨"으로 바뀐다.

---

## Self-Review 결과

- **Spec 커버리지:** orders 테이블/RLS(Task 1), Order 타입(Task 2), 검증(Task 3), 데이터 함수(Task 4), 서버액션(Task 5), 손님 폼/페이지(Task 6·7), 주문하기 버튼(Task 8), 관리자 목록/페이지(Task 9·10) — spec의 모든 섹션이 태스크에 매핑됨.
- **플레이스홀더:** 없음. 모든 코드 단계에 실제 코드 포함.
- **타입 일관성:** `OrderWriteInput`(camelCase) ↔ DB 컬럼(snake_case) 매핑은 `createOrder` 내부에서만 변환. `validateOrderInput` 입력 키(`customerName` 등)와 `submitOrder` 가 넘기는 키 일치. `Order` 타입 속성과 `OrderList`/`getOrders` 사용 속성 일치.
