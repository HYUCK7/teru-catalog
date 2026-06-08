# 쇼핑몰형 카탈로그 웹 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 가게용 상품 카탈로그 웹을 만든다. 고객은 메인→메뉴→상품상세를 둘러보고 문의(카톡/전화/인스타)하며, 관리자는 로고·배너·가게정보·카테고리·상품을 직접 등록·관리한다.

**Architecture:** Next.js(App Router) 단일 앱이 프론트와 서버 로직을 모두 담당한다. 데이터는 Supabase Postgres, 이미지는 Supabase Storage, 관리자 인증은 Supabase Auth(단일 계정)를 쓴다. 고객 화면은 공개 읽기, 관리자 쓰기는 RLS + 미들웨어 세션 가드로 보호한다. 순수 검증 로직과 데이터 접근 계층을 UI에서 분리해 단위 테스트한다.

**Tech Stack:** Next.js 15 (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Postgres/Storage/Auth) · Vitest (테스트) · Vercel(배포)

---

## File Structure

```
shopmall/
├─ app/
│  ├─ (customer)/
│  │  ├─ page.tsx                  # 메인(랜딩)
│  │  ├─ menu/page.tsx             # 카테고리 탭 + 상품 그리드
│  │  └─ products/[id]/page.tsx    # 상품 상세
│  ├─ admin/
│  │  ├─ login/page.tsx
│  │  ├─ settings/page.tsx
│  │  ├─ categories/page.tsx
│  │  ├─ products/page.tsx
│  │  └─ products/[id]/page.tsx
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ ui/                          # shadcn 생성 컴포넌트
│  ├─ customer/                    # ProductCard, ContactButtons, ImageSlider 등
│  └─ admin/                       # ImageUploader, CategoryRow 등
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts                 # 브라우저용 클라이언트
│  │  ├─ server.ts                 # 서버용 클라이언트(쿠키)
│  │  └─ types.ts                  # DB row 타입
│  ├─ validation.ts                # 순수 검증 함수 (단위 테스트 핵심)
│  └─ data/
│     ├─ settings.ts               # site_settings 조회/저장
│     ├─ categories.ts             # 카테고리 CRUD
│     └─ products.ts               # 상품 + 이미지 CRUD
├─ actions/                        # Server Actions (admin 쓰기)
│  ├─ settings.ts
│  ├─ categories.ts
│  └─ products.ts
├─ middleware.ts                   # /admin/* 세션 가드
├─ supabase/
│  └─ migrations/                  # SQL 마이그레이션 (스키마 + RLS + 버킷 정책)
├─ test/                           # Vitest 셋업 및 mock 헬퍼
└─ ...설정 파일
```

각 파일은 단일 책임을 가진다. `lib/validation.ts`는 부수효과 없는 순수 함수만(테스트 1순위). `lib/data/*`는 Supabase 쿼리만 담당하고 UI를 모른다. `actions/*`는 검증→데이터호출→재검증(revalidate)을 묶는 얇은 계층.

---

## Phase 0 — 프로젝트 스캐폴드

### Task 1: Next.js + TypeScript + Tailwind 스캐폴드

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/(customer)/page.tsx`

- [ ] **Step 1: 기존 plan/docs 보존하며 Next 앱 생성**

이미 `docs/`, `plan.md`, `.git`이 있으므로 현재 디렉토리에 직접 생성한다.

Run:

```bash
cd /Users/jaehyuck/dev/shopmall
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias "@/*" --eslint --no-turbopack --use-npm
```

프롬프트에서 기존 파일 덮어쓰기 충돌이 나면 `docs/`, `plan.md`, `.gitignore`는 유지하도록 한다(생성기는 빈 디렉토리 가정이므로, 충돌 시 임시 폴더에 생성 후 파일을 복사하는 방식으로 처리).

- [ ] **Step 2: 개발 서버 기동 확인**

Run: `npm run dev`
Expected: `http://localhost:3000`에서 기본 Next 페이지가 뜬다. 확인 후 종료(Ctrl+C).

- [ ] **Step 3: 메인 페이지를 임시 마커로 교체**

`app/(customer)/page.tsx`로 루트를 옮기기 위해 기존 `app/page.tsx`를 삭제하고 라우트 그룹을 만든다.

```tsx
// app/(customer)/page.tsx
export default function HomePage() {
  return <main className="p-6 text-center">쇼핑몰 준비중</main>;
}
```

Run: `rm -f app/page.tsx && npm run dev` → `/`에서 "쇼핑몰 준비중" 확인.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: Next.js + TypeScript + Tailwind 스캐폴드"
```

### Task 2: Vitest 테스트 환경 구성

**Files:**

- Create: `vitest.config.ts`, `test/setup.ts`, `lib/sample.ts`, `lib/sample.test.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: 의존성 설치**

Run: `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`

- [ ] **Step 2: vitest 설정 작성**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

```ts
// test/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: package.json 스크립트 추가**

`"scripts"`에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 동작 검증용 임시 테스트 작성**

```ts
// lib/sample.ts
export const add = (a: number, b: number) => a + b;
```

```ts
// lib/sample.test.ts
import { describe, it, expect } from "vitest";
import { add } from "./sample";
describe("add", () => {
  it("두 수를 더한다", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

- [ ] **Step 5: 테스트 실행**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 6: 임시 파일 정리 후 커밋**

```bash
rm lib/sample.ts lib/sample.test.ts
git add -A
git commit -m "chore: Vitest 테스트 환경 구성"
```

### Task 3: shadcn/ui 초기화

**Files:**

- Create: `components.json`, `components/ui/*`, `lib/utils.ts`

- [ ] **Step 1: shadcn 초기화**

Run: `npx shadcn@latest init -d`
Expected: `components.json`, `lib/utils.ts` 생성.

- [ ] **Step 2: 기본 컴포넌트 추가**

Run: `npx shadcn@latest add button input textarea label card`
Expected: `components/ui/`에 해당 컴포넌트 생성.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: shadcn/ui 초기화 및 기본 컴포넌트 추가"
```

---

## Phase 1 — Supabase 스키마 & 클라이언트

### Task 4: Supabase 프로젝트 연결 및 환경변수

**Files:**

- Create: `.env.local`, `.env.example`
- Modify: `.gitignore` (이미 `.env*.local` 무시 중인지 확인)

- [ ] **Step 1: Supabase 의존성 설치**

Run: `npm i @supabase/supabase-js @supabase/ssr`

- [ ] **Step 2: 환경변수 템플릿 작성**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

실제 값은 Supabase 대시보드(Project Settings → API)에서 받아 `.env.local`에 채운다. 로컬 개발은 `npx supabase start`로 로컬 인스턴스를 써도 된다(아래 Task 5).

- [ ] **Step 3: Commit**

```bash
git add .env.example package.json package-lock.json
git commit -m "chore: Supabase 클라이언트 의존성 및 env 템플릿"
```

### Task 5: DB 스키마 마이그레이션

**Files:**

- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Supabase CLI 초기화(로컬 개발용)**

Run: `npx supabase init`
Expected: `supabase/` 디렉토리 생성.

- [ ] **Step 2: 스키마 SQL 작성**

```sql
-- supabase/migrations/0001_init.sql

-- 가게 설정 (단일 행)
create table site_settings (
  id int primary key default 1,
  shop_name text not null default '',
  intro text not null default '',
  logo_url text,
  banner_url text,
  kakao_channel_url text,
  phone text,
  instagram text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into site_settings (id) values (1);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete restrict,
  name text not null,
  price int not null default 0,
  description text not null default '',
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);

create index on products (category_id);
create index on product_images (product_id);
```

> 카테고리 삭제 정책: `on delete restrict` — 소속 상품이 있으면 삭제가 막힌다(spec 기본안).

- [ ] **Step 3: 마이그레이션 적용**

로컬: `npx supabase start` 후 `npx supabase db reset`
원격: `npx supabase link --project-ref <ref>` 후 `npx supabase db push`
Expected: 4개 테이블 생성, `site_settings`에 1행.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat(db): 초기 스키마 마이그레이션(설정/카테고리/상품/이미지)"
```

### Task 6: RLS 및 Storage 정책 마이그레이션

**Files:**

- Create: `supabase/migrations/0002_rls_storage.sql`

- [ ] **Step 1: RLS + 버킷 정책 SQL 작성**

```sql
-- supabase/migrations/0002_rls_storage.sql

-- Storage 버킷
insert into storage.buckets (id, name, public) values
  ('public-assets', 'public-assets', true),
  ('products', 'products', true)
on conflict (id) do nothing;

-- RLS 활성화
alter table site_settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;

-- 공개 읽기
create policy "public read settings" on site_settings for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read product_images" on product_images for select using (true);

-- 인증 사용자(관리자) 쓰기
create policy "admin write settings" on site_settings for all
  to authenticated using (true) with check (true);
create policy "admin write categories" on categories for all
  to authenticated using (true) with check (true);
create policy "admin write products" on products for all
  to authenticated using (true) with check (true);
create policy "admin write product_images" on product_images for all
  to authenticated using (true) with check (true);

-- Storage: 공개 읽기, 인증 사용자 쓰기
create policy "public read assets" on storage.objects for select
  using (bucket_id in ('public-assets','products'));
create policy "admin write assets" on storage.objects for all
  to authenticated using (bucket_id in ('public-assets','products'))
  with check (bucket_id in ('public-assets','products'));
```

> 고객 화면은 `is_visible = true` 필터를 쿼리에서 적용한다(데이터 계층에서 처리, Task 9).

- [ ] **Step 2: 적용**

Run(로컬): `npx supabase db reset`
Expected: 정책 생성 성공, 에러 없음.

- [ ] **Step 3: 관리자 계정 수동 생성 안내 기록**

`docs/superpowers/plans/`에 본 플랜이 있으므로, README에 한 줄 남긴다(Task 7 이후). 지금은 커밋만.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat(db): RLS 정책 및 Storage 버킷/정책"
```

### Task 7: Supabase 클라이언트 & 타입

**Files:**

- Create: `lib/supabase/types.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`

- [ ] **Step 1: DB row 타입 작성**

```ts
// lib/supabase/types.ts
export type SiteSettings = {
  id: number;
  shop_name: string;
  intro: string;
  logo_url: string | null;
  banner_url: string | null;
  kakao_channel_url: string | null;
  phone: string | null;
  instagram: string | null;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  description: string;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
};

export type ProductWithImages = Product & { images: ProductImage[] };
```

- [ ] **Step 2: 브라우저 클라이언트**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: 서버 클라이언트(쿠키 연동)**

```ts
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 호출 시 무시 (미들웨어가 갱신 담당)
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase
git commit -m "feat: Supabase 클라이언트(브라우저/서버) 및 DB 타입"
```

---

## Phase 2 — 검증 로직 & 데이터 계층 (TDD 핵심)

### Task 8: 순수 검증 함수

**Files:**

- Create: `lib/validation.ts`, `lib/validation.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// lib/validation.test.ts
import { describe, it, expect } from "vitest";
import {
  validateProductInput,
  validateCategoryInput,
  validateSettingsInput,
} from "./validation";

describe("validateProductInput", () => {
  it("상품명이 비면 에러", () => {
    const r = validateProductInput({ name: "", price: 1000, categoryId: "c1" });
    expect(r.ok).toBe(false);
    expect(r.errors.name).toBeDefined();
  });
  it("가격이 음수면 에러", () => {
    const r = validateProductInput({
      name: "셔츠",
      price: -1,
      categoryId: "c1",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.price).toBeDefined();
  });
  it("카테고리가 없으면 에러", () => {
    const r = validateProductInput({
      name: "셔츠",
      price: 1000,
      categoryId: "",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.categoryId).toBeDefined();
  });
  it("정상 입력은 ok", () => {
    const r = validateProductInput({
      name: "셔츠",
      price: 1000,
      categoryId: "c1",
    });
    expect(r.ok).toBe(true);
  });
});

describe("validateCategoryInput", () => {
  it("이름이 비면 에러", () => {
    expect(validateCategoryInput({ name: "  " }).ok).toBe(false);
  });
  it("정상 이름은 ok", () => {
    expect(validateCategoryInput({ name: "상의" }).ok).toBe(true);
  });
});

describe("validateSettingsInput", () => {
  it("가게명이 비면 에러", () => {
    expect(validateSettingsInput({ shop_name: "" }).ok).toBe(false);
  });
  it("정상 가게명은 ok", () => {
    expect(validateSettingsInput({ shop_name: "우리가게" }).ok).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run lib/validation.test.ts`
Expected: FAIL — "validateProductInput is not a function" 류.

- [ ] **Step 3: 최소 구현**

```ts
// lib/validation.ts
export type ValidationResult = { ok: boolean; errors: Record<string, string> };

const ok = (): ValidationResult => ({ ok: true, errors: {} });
const fail = (errors: Record<string, string>): ValidationResult => ({
  ok: false,
  errors,
});

export function validateProductInput(input: {
  name: string;
  price: number;
  categoryId: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors.name = "상품명을 입력하세요.";
  if (!Number.isFinite(input.price) || input.price < 0)
    errors.price = "가격은 0 이상이어야 합니다.";
  if (!input.categoryId) errors.categoryId = "카테고리를 선택하세요.";
  return Object.keys(errors).length ? fail(errors) : ok();
}

export function validateCategoryInput(input: {
  name: string;
}): ValidationResult {
  return input.name.trim()
    ? ok()
    : fail({ name: "카테고리 이름을 입력하세요." });
}

export function validateSettingsInput(input: {
  shop_name: string;
}): ValidationResult {
  return input.shop_name.trim()
    ? ok()
    : fail({ shop_name: "가게명을 입력하세요." });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/validation.test.ts`
Expected: 전부 PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts lib/validation.test.ts
git commit -m "feat: 입력 검증 순수 함수 + 테스트"
```

### Task 9: 데이터 계층 — 상품 조회(노출 필터)

**Files:**

- Create: `test/mock-supabase.ts`, `lib/data/products.ts`, `lib/data/products.test.ts`

- [ ] **Step 1: Supabase mock 헬퍼 작성**

체이닝(`.from().select().eq().order()`)을 흉내내는 최소 mock. 마지막에 `data`/`error`를 반환한다.

```ts
// test/mock-supabase.ts
import { vi } from "vitest";

type QueryResult = { data: unknown; error: unknown };

export function makeQuery(result: QueryResult) {
  const q: Record<string, unknown> = {};
  const chain = () => q;
  q.select = vi.fn(chain);
  q.eq = vi.fn(chain);
  q.order = vi.fn(chain);
  q.single = vi.fn(() => Promise.resolve(result));
  // thenable: await q -> result
  q.then = (onfulfilled: (v: QueryResult) => unknown) =>
    Promise.resolve(result).then(onfulfilled);
  return q;
}

export function makeClient(byTable: Record<string, QueryResult>) {
  return {
    from: vi.fn((table: string) =>
      makeQuery(byTable[table] ?? { data: [], error: null }),
    ),
  };
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

```ts
// lib/data/products.test.ts
import { describe, it, expect } from "vitest";
import { getVisibleProductsByCategory } from "./products";
import { makeClient } from "@/test/mock-supabase";

describe("getVisibleProductsByCategory", () => {
  it("주어진 카테고리의 상품 목록을 반환한다", async () => {
    const client = makeClient({
      products: {
        data: [{ id: "p1", name: "셔츠", is_visible: true }],
        error: null,
      },
    });
    const rows = await getVisibleProductsByCategory(client as never, "c1");
    expect(rows).toHaveLength(1);
    expect(client.from).toHaveBeenCalledWith("products");
  });

  it("에러가 나면 throw 한다", async () => {
    const client = makeClient({
      products: { data: null, error: { message: "boom" } },
    });
    await expect(
      getVisibleProductsByCategory(client as never, "c1"),
    ).rejects.toThrow("boom");
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run lib/data/products.test.ts`
Expected: FAIL — 함수 없음.

- [ ] **Step 4: 구현**

```ts
// lib/data/products.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Product,
  ProductImage,
  ProductWithImages,
} from "@/lib/supabase/types";

export async function getVisibleProductsByCategory(
  supabase: SupabaseClient,
  categoryId: string | null,
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function getProductWithImages(
  supabase: SupabaseClient,
  id: string,
): Promise<ProductWithImages | null> {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null; // not found
    throw new Error(error.message);
  }
  const { data: images, error: imgErr } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });
  if (imgErr) throw new Error(imgErr.message);
  return { ...(product as Product), images: (images ?? []) as ProductImage[] };
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run lib/data/products.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/data/products.ts lib/data/products.test.ts test/mock-supabase.ts
git commit -m "feat(data): 상품 조회(노출 필터/상세+이미지) + 테스트"
```

### Task 10: 데이터 계층 — 상품 쓰기(CRUD + 이미지)

**Files:**

- Modify: `lib/data/products.ts`
- Create: `lib/data/products.write.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// lib/data/products.write.test.ts
import { describe, it, expect, vi } from "vitest";
import { createProduct } from "./products";

function insertClient(returnRow: unknown, error: unknown = null) {
  const single = vi.fn(() => Promise.resolve({ data: returnRow, error }));
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));
  return { client: { from }, insert };
}

describe("createProduct", () => {
  it("products 테이블에 insert 하고 생성된 행을 반환한다", async () => {
    const { client, insert } = insertClient({ id: "p1", name: "셔츠" });
    const row = await createProduct(client as never, {
      name: "셔츠",
      price: 1000,
      categoryId: "c1",
      description: "설명",
      isVisible: true,
    });
    expect(insert).toHaveBeenCalled();
    expect(row.id).toBe("p1");
  });

  it("에러 시 throw", async () => {
    const { client } = insertClient(null, { message: "fail" });
    await expect(
      createProduct(client as never, {
        name: "셔츠",
        price: 1000,
        categoryId: "c1",
        description: "",
        isVisible: true,
      }),
    ).rejects.toThrow("fail");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/data/products.write.test.ts`
Expected: FAIL — `createProduct` 없음.

- [ ] **Step 3: 구현 추가 (products.ts 하단에 append)**

```ts
// lib/data/products.ts (append)
export type ProductWriteInput = {
  name: string;
  price: number;
  categoryId: string;
  description: string;
  isVisible: boolean;
};

export async function createProduct(
  supabase: SupabaseClient,
  input: ProductWriteInput,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      price: input.price,
      category_id: input.categoryId,
      description: input.description,
      is_visible: input.isVisible,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(
  supabase: SupabaseClient,
  id: string,
  input: ProductWriteInput,
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      price: input.price,
      category_id: input.categoryId,
      description: input.description,
      is_visible: input.isVisible,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addProductImage(
  supabase: SupabaseClient,
  productId: string,
  imageUrl: string,
  sortOrder: number,
): Promise<void> {
  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: imageUrl,
    sort_order: sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function deleteProductImage(
  supabase: SupabaseClient,
  imageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);
  if (error) throw new Error(error.message);
}

export async function getAllProducts(
  supabase: SupabaseClient,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run lib/data/products.write.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/data/products.ts lib/data/products.write.test.ts
git commit -m "feat(data): 상품 CRUD 및 이미지 추가/삭제 + 테스트"
```

### Task 11: 데이터 계층 — 카테고리 & 설정

**Files:**

- Create: `lib/data/categories.ts`, `lib/data/categories.test.ts`, `lib/data/settings.ts`, `lib/data/settings.test.ts`

- [ ] **Step 1: 카테고리 테스트 작성**

```ts
// lib/data/categories.test.ts
import { describe, it, expect } from "vitest";
import { getCategories } from "./categories";
import { makeClient } from "@/test/mock-supabase";

describe("getCategories", () => {
  it("sort_order 순으로 카테고리를 반환한다", async () => {
    const client = makeClient({
      categories: {
        data: [{ id: "c1", name: "상의", sort_order: 0 }],
        error: null,
      },
    });
    const rows = await getCategories(client as never);
    expect(rows[0].name).toBe("상의");
  });
  it("에러 시 throw", async () => {
    const client = makeClient({
      categories: { data: null, error: { message: "x" } },
    });
    await expect(getCategories(client as never)).rejects.toThrow("x");
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현**

Run: `npx vitest run lib/data/categories.test.ts` → FAIL 확인 후 구현:

```ts
// lib/data/categories.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/lib/supabase/types";

export async function getCategories(
  supabase: SupabaseClient,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function createCategory(
  supabase: SupabaseClient,
  name: string,
  sortOrder: number,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  fields: { name?: string; sort_order?: number },
): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update(fields)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCategory(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message); // 소속 상품 있으면 FK restrict 에러 메시지 전달
}
```

- [ ] **Step 3: 통과 확인**

Run: `npx vitest run lib/data/categories.test.ts` → PASS.

- [ ] **Step 4: 설정 테스트 작성**

```ts
// lib/data/settings.test.ts
import { describe, it, expect } from "vitest";
import { getSettings } from "./settings";
import { makeClient } from "@/test/mock-supabase";

describe("getSettings", () => {
  it("단일 설정 행을 반환한다", async () => {
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { id: 1, shop_name: "가게" },
                error: null,
              }),
          }),
        }),
      }),
    };
    const s = await getSettings(client as never);
    expect(s.shop_name).toBe("가게");
  });
});
```

- [ ] **Step 5: 실패 확인 → 구현**

Run: `npx vitest run lib/data/settings.test.ts` → FAIL 후 구현:

```ts
// lib/data/settings.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SiteSettings } from "@/lib/supabase/types";

export async function getSettings(
  supabase: SupabaseClient,
): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return data as SiteSettings;
}

export async function updateSettings(
  supabase: SupabaseClient,
  fields: Partial<Omit<SiteSettings, "id" | "updated_at">>,
): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 6: 통과 확인 후 커밋**

Run: `npx vitest run lib/data` → 전부 PASS.

```bash
git add lib/data
git commit -m "feat(data): 카테고리/설정 조회·변경 + 테스트"
```

---

## Phase 3 — 인증 & 관리자 가드

### Task 12: /admin 세션 가드 미들웨어

**Files:**

- Create: `middleware.ts`, `lib/supabase/middleware.ts`

- [ ] **Step 1: 세션 갱신 헬퍼 작성**

```ts
// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAdmin = path.startsWith("/admin");
  const isLogin = path === "/admin/login";

  if (isAdmin && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/settings";
    return NextResponse.redirect(url);
  }
  return response;
}
```

- [ ] **Step 2: 미들웨어 등록**

```ts
// middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts lib/supabase/middleware.ts
git commit -m "feat(auth): /admin 세션 가드 미들웨어"
```

### Task 13: 관리자 로그인 페이지 + 로그아웃

**Files:**

- Create: `app/admin/login/page.tsx`, `actions/auth.ts`, `components/admin/AdminNav.tsx`

- [ ] **Step 1: 로그인/로그아웃 Server Action**

```ts
// actions/auth.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  redirect("/admin/settings");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

- [ ] **Step 2: 로그인 페이지(클라이언트 폼)**

```tsx
// app/admin/login/page.tsx
"use client";
import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-xl font-bold">관리자 로그인</h1>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="password">비밀번호</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: 관리자 공용 네비(로그아웃 포함)**

```tsx
// components/admin/AdminNav.tsx
import Link from "next/link";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function AdminNav() {
  return (
    <nav className="flex flex-wrap items-center gap-4 border-b p-4 text-sm">
      <Link href="/admin/settings" className="font-medium">
        사이트 설정
      </Link>
      <Link href="/admin/categories">카테고리</Link>
      <Link href="/admin/products">상품</Link>
      <form action={logout} className="ml-auto">
        <Button variant="outline" size="sm">
          로그아웃
        </Button>
      </form>
    </nav>
  );
}
```

- [ ] **Step 4: 수동 검증**

Supabase 대시보드(Authentication → Users → Add user)에서 관리자 계정 1개 생성. `npm run dev` 후 `/admin/settings` 접근 → 로그인으로 리다이렉트되는지, 로그인 성공 시 진입되는지 확인.
Expected: 비로그인 차단, 로그인 후 진입.

- [ ] **Step 5: Commit**

```bash
git add app/admin/login actions/auth.ts components/admin/AdminNav.tsx
git commit -m "feat(auth): 관리자 로그인/로그아웃 및 관리자 네비"
```

---

## Phase 4 — 관리자: 사이트 설정

### Task 14: 이미지 업로드 유틸 + 업로더 컴포넌트

**Files:**

- Create: `lib/upload.ts`, `lib/upload.test.ts`, `components/admin/ImageUploader.tsx`

- [ ] **Step 1: 업로드 파일 검증 테스트(순수 함수)**

```ts
// lib/upload.test.ts
import { describe, it, expect } from "vitest";
import { validateImageFile } from "./upload";

describe("validateImageFile", () => {
  it("허용되지 않은 형식은 에러", () => {
    const r = validateImageFile({ type: "application/pdf", size: 100 });
    expect(r.ok).toBe(false);
  });
  it("용량 초과는 에러", () => {
    const r = validateImageFile({ type: "image/png", size: 11 * 1024 * 1024 });
    expect(r.ok).toBe(false);
  });
  it("정상 파일은 ok", () => {
    const r = validateImageFile({ type: "image/jpeg", size: 1024 });
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현**

Run: `npx vitest run lib/upload.test.ts` → FAIL 후 구현:

```ts
// lib/upload.ts
import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: { type: string; size: number }) {
  if (!ALLOWED.includes(file.type))
    return { ok: false, error: "jpg/png/webp만 업로드할 수 있습니다." };
  if (file.size > MAX_BYTES)
    return { ok: false, error: "이미지는 10MB 이하만 가능합니다." };
  return { ok: true, error: "" };
}

export async function uploadImage(
  supabase: SupabaseClient,
  bucket: "public-assets" | "products",
  path: string,
  file: File,
): Promise<string> {
  const check = validateImageFile(file);
  if (!check.ok) throw new Error(check.error);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
```

- [ ] **Step 3: 통과 확인**

Run: `npx vitest run lib/upload.test.ts` → PASS.

- [ ] **Step 4: 업로더 컴포넌트(클라이언트, 브라우저 클라이언트로 업로드)**

```tsx
// components/admin/ImageUploader.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { Button } from "@/components/ui/button";

export function ImageUploader({
  bucket,
  pathPrefix,
  onUploaded,
}: {
  bucket: "public-assets" | "products";
  pathPrefix: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${pathPrefix}/${Date.now()}-${safeName}`;
      const url = await uploadImage(supabase, bucket, path, file);
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={busy}
      />
      {busy && <p className="text-sm text-gray-500">업로드 중...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

> `Date.now()`는 런타임(브라우저)에서 실행되므로 정상. (이 제약은 워크플로우 스크립트에만 해당.)

- [ ] **Step 5: Commit**

```bash
git add lib/upload.ts lib/upload.test.ts components/admin/ImageUploader.tsx
git commit -m "feat: 이미지 업로드 검증/유틸 및 업로더 컴포넌트"
```

### Task 15: 사이트 설정 페이지 + Server Action

**Files:**

- Create: `actions/settings.ts`, `app/admin/settings/page.tsx`, `components/admin/SettingsForm.tsx`

- [ ] **Step 1: 설정 저장 Server Action**

```ts
// actions/settings.ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "@/lib/data/settings";
import { validateSettingsInput } from "@/lib/validation";

export async function saveSettings(_prev: unknown, formData: FormData) {
  const shop_name = String(formData.get("shop_name") ?? "");
  const v = validateSettingsInput({ shop_name });
  if (!v.ok) return { ok: false, errors: v.errors };

  const supabase = await createClient();
  await updateSettings(supabase, {
    shop_name,
    intro: String(formData.get("intro") ?? ""),
    logo_url: emptyToNull(formData.get("logo_url")),
    banner_url: emptyToNull(formData.get("banner_url")),
    kakao_channel_url: emptyToNull(formData.get("kakao_channel_url")),
    phone: emptyToNull(formData.get("phone")),
    instagram: emptyToNull(formData.get("instagram")),
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, errors: {} };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
```

- [ ] **Step 2: 설정 폼(클라이언트, 이미지 URL은 hidden + 업로더로 채움)**

```tsx
// components/admin/SettingsForm.tsx
"use client";
import { useActionState, useState } from "react";
import type { SiteSettings } from "@/lib/supabase/types";
import { saveSettings } from "@/actions/settings";
import { ImageUploader } from "./ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(initial.banner_url ?? "");

  return (
    <form action={action} className="max-w-lg space-y-4 p-4">
      <div>
        <Label>로고</Label>
        {logoUrl && (
          <img src={logoUrl} alt="logo" className="my-2 h-16 object-contain" />
        )}
        <ImageUploader
          bucket="public-assets"
          pathPrefix="logo"
          onUploaded={setLogoUrl}
        />
        <input type="hidden" name="logo_url" value={logoUrl} />
      </div>
      <div>
        <Label>대표 배너</Label>
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="banner"
            className="my-2 h-24 w-full object-cover"
          />
        )}
        <ImageUploader
          bucket="public-assets"
          pathPrefix="banner"
          onUploaded={setBannerUrl}
        />
        <input type="hidden" name="banner_url" value={bannerUrl} />
      </div>
      <Field
        name="shop_name"
        label="가게명"
        defaultValue={initial.shop_name}
        error={state?.errors?.shop_name}
      />
      <div>
        <Label htmlFor="intro">소개 문구</Label>
        <Textarea id="intro" name="intro" defaultValue={initial.intro} />
      </div>
      <Field
        name="kakao_channel_url"
        label="카톡 채널 링크"
        defaultValue={initial.kakao_channel_url ?? ""}
      />
      <Field name="phone" label="전화번호" defaultValue={initial.phone ?? ""} />
      <Field
        name="instagram"
        label="인스타 계정"
        defaultValue={initial.instagram ?? ""}
      />
      {state?.ok && <p className="text-sm text-green-600">저장되었습니다.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: 설정 페이지(서버 컴포넌트)**

```tsx
// app/admin/settings/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/settings";
import { AdminNav } from "@/components/admin/AdminNav";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const settings = await getSettings(supabase);
  return (
    <div>
      <AdminNav />
      <h1 className="p-4 text-xl font-bold">사이트 설정</h1>
      <SettingsForm initial={settings} />
    </div>
  );
}
```

- [ ] **Step 4: 수동 검증**

`npm run dev` → 로그인 → `/admin/settings`에서 로고/배너 업로드, 가게명·문의처 입력 후 저장 → 새로고침 시 값 유지 확인.
Expected: 값 저장·유지, 이미지 미리보기 표시.

- [ ] **Step 5: Commit**

```bash
git add actions/settings.ts app/admin/settings components/admin/SettingsForm.tsx
git commit -m "feat(admin): 사이트 설정 페이지 및 저장 액션"
```

---

## Phase 5 — 관리자: 카테고리 관리

### Task 16: 카테고리 관리 페이지 + 액션

**Files:**

- Create: `actions/categories.ts`, `app/admin/categories/page.tsx`, `components/admin/CategoryManager.tsx`

- [ ] **Step 1: 카테고리 액션**

```ts
// actions/categories.ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
} from "@/lib/data/categories";
import { validateCategoryInput } from "@/lib/validation";

export async function addCategory(_prev: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const v = validateCategoryInput({ name });
  if (!v.ok) return { ok: false, error: v.errors.name };
  const supabase = await createClient();
  const existing = await getCategories(supabase);
  await createCategory(supabase, name.trim(), existing.length);
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ok: true, error: "" };
}

export async function renameCategory(id: string, name: string) {
  const v = validateCategoryInput({ name });
  if (!v.ok) return { ok: false, error: v.errors.name };
  const supabase = await createClient();
  await updateCategory(supabase, id, { name: name.trim() });
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ok: true, error: "" };
}

export async function removeCategory(id: string) {
  const supabase = await createClient();
  try {
    await deleteCategory(supabase, id);
  } catch {
    return {
      ok: false,
      error: "이 카테고리에 속한 상품이 있어 삭제할 수 없습니다.",
    };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ok: true, error: "" };
}
```

- [ ] **Step 2: 카테고리 매니저 컴포넌트**

```tsx
// components/admin/CategoryManager.tsx
"use client";
import { useState } from "react";
import type { Category } from "@/lib/supabase/types";
import {
  addCategory,
  renameCategory,
  removeCategory,
} from "@/actions/categories";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(addCategory, null);
  const [msg, setMsg] = useState("");

  return (
    <div className="max-w-md space-y-4 p-4">
      <form action={action} className="flex gap-2">
        <Input name="name" placeholder="새 카테고리 이름" />
        <Button type="submit" disabled={pending}>
          추가
        </Button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2 rounded border p-2">
            <Input
              defaultValue={c.name}
              className="flex-1"
              onBlur={async (e) => {
                if (e.target.value !== c.name) {
                  const r = await renameCategory(c.id, e.target.value);
                  if (!r.ok) setMsg(r.error);
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const r = await removeCategory(c.id);
                if (!r.ok) setMsg(r.error);
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
```

> 순서 변경(드래그)은 MVP 이후 개선 항목. 지금은 추가 순서(sort_order)대로 표시.

- [ ] **Step 3: 카테고리 페이지**

```tsx
// app/admin/categories/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data/categories";
import { AdminNav } from "@/components/admin/AdminNav";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase);
  return (
    <div>
      <AdminNav />
      <h1 className="p-4 text-xl font-bold">카테고리 관리</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
```

- [ ] **Step 4: 수동 검증**

`/admin/categories`에서 추가/이름변경(blur)/삭제 동작 확인. 상품이 있는 카테고리 삭제 시 에러 메시지 표시.
Expected: CRUD 동작, FK 보호 메시지.

- [ ] **Step 5: Commit**

```bash
git add actions/categories.ts app/admin/categories components/admin/CategoryManager.tsx
git commit -m "feat(admin): 카테고리 관리 페이지 및 액션"
```

---

## Phase 6 — 관리자: 상품 관리

### Task 17: 상품 목록 페이지

**Files:**

- Create: `app/admin/products/page.tsx`

- [ ] **Step 1: 상품 목록 페이지 작성**

```tsx
// app/admin/products/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllProducts } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    getAllProducts(supabase),
    getCategories(supabase),
  ]);
  const catName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "-";

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">상품 관리</h1>
        <Link href="/admin/products/new">
          <Button>+ 상품 추가</Button>
        </Link>
      </div>
      <ul className="divide-y">
        {products.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-4">
            <span className="flex-1">{p.name}</span>
            <span className="text-sm text-gray-500">
              {catName(p.category_id)}
            </span>
            <span className="text-sm">{p.price.toLocaleString()}원</span>
            <span className={p.is_visible ? "text-green-600" : "text-gray-400"}>
              {p.is_visible ? "노출" : "숨김"}
            </span>
            <Link
              href={`/admin/products/${p.id}`}
              className="text-sm underline"
            >
              편집
            </Link>
          </li>
        ))}
        {products.length === 0 && (
          <li className="p-4 text-gray-500">등록된 상품이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: 타입체크 + 수동 확인**

Run: `npx tsc --noEmit` → 에러 없음. `/admin/products` 진입 시 빈 목록/추가 버튼 표시.

- [ ] **Step 3: Commit**

```bash
git add app/admin/products/page.tsx
git commit -m "feat(admin): 상품 목록 페이지"
```

### Task 18: 상품 등록/수정 폼 + 액션

**Files:**

- Create: `actions/products.ts`, `app/admin/products/[id]/page.tsx`, `components/admin/ProductForm.tsx`

- [ ] **Step 1: 상품 액션**

```ts
// actions/products.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
} from "@/lib/data/products";
import { validateProductInput } from "@/lib/validation";

type SaveResult = { ok: boolean; errors: Record<string, string>; id?: string };

export async function saveProduct(
  productId: string | null,
  _prev: unknown,
  formData: FormData,
): Promise<SaveResult> {
  const name = String(formData.get("name") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const categoryId = String(formData.get("category_id") ?? "");
  const description = String(formData.get("description") ?? "");
  const isVisible = formData.get("is_visible") === "on";

  const v = validateProductInput({ name, price, categoryId });
  if (!v.ok) return { ok: false, errors: v.errors };

  const supabase = await createClient();
  const input = { name, price, categoryId, description, isVisible };

  let id = productId;
  if (id) {
    await updateProduct(supabase, id, input);
  } else {
    const created = await createProduct(supabase, input);
    id = created.id;
  }

  // 신규 이미지 URL들 (콤마 구분 hidden 필드)
  const newImages = String(formData.get("new_image_urls") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (let i = 0; i < newImages.length; i++) {
    await addProductImage(supabase, id, newImages[i], i);
  }

  revalidatePath("/menu");
  revalidatePath(`/products/${id}`);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function removeProduct(id: string) {
  const supabase = await createClient();
  await deleteProduct(supabase, id);
  revalidatePath("/menu");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function removeImage(imageId: string, productId: string) {
  const supabase = await createClient();
  await deleteProductImage(supabase, imageId);
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${productId}`);
}
```

- [ ] **Step 2: 상품 폼 컴포넌트**

```tsx
// components/admin/ProductForm.tsx
"use client";
import { useActionState, useState } from "react";
import type { Category, ProductWithImages } from "@/lib/supabase/types";
import { saveProduct, removeImage } from "@/actions/products";
import { ImageUploader } from "./ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
          {product?.images.map((img) => (
            <div key={img.id} className="relative">
              <img
                src={img.image_url}
                alt=""
                className="h-20 w-20 rounded object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(img.id, product.id)}
                className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
          {newUrls.map((u) => (
            <img
              key={u}
              src={u}
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
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
```

- [ ] **Step 3: 등록/수정 페이지(`new`와 `[id]` 공용)**

```tsx
// app/admin/products/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getProductWithImages } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import { removeProduct } from "@/actions/products";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const categories = await getCategories(supabase);

  const isNew = id === "new";
  const product = isNew ? null : await getProductWithImages(supabase, id);
  if (!isNew && !product) notFound();

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">
          {isNew ? "상품 추가" : "상품 수정"}
        </h1>
        {!isNew && product && (
          <form action={removeProduct.bind(null, product.id)}>
            <Button variant="destructive" size="sm">
              삭제
            </Button>
          </form>
        )}
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
```

- [ ] **Step 4: 수동 검증**

`/admin/products/new`에서 사진 업로드+상품 입력 후 저장 → 목록 반영. 편집 진입 시 기존 값/사진 표시, 사진 삭제·노출 토글·삭제 동작 확인. 필수값 누락 시 에러 메시지.
Expected: 등록/수정/삭제/이미지 관리 동작.

- [ ] **Step 5: Commit**

```bash
git add actions/products.ts "app/admin/products/[id]" components/admin/ProductForm.tsx
git commit -m "feat(admin): 상품 등록/수정/삭제 폼 및 액션"
```

---

## Phase 7 — 고객 화면

### Task 19: 고객 공용 컴포넌트(상품 카드 · 문의 버튼 · 슬라이더)

**Files:**

- Create: `components/customer/ProductCard.tsx`, `components/customer/ContactButtons.tsx`, `components/customer/ImageSlider.tsx`

- [ ] **Step 1: 상품 카드**

```tsx
// components/customer/ProductCard.tsx
import Link from "next/link";
import type { Product } from "@/lib/supabase/types";

export function ProductCard({
  product,
  thumbnail,
}: {
  product: Product;
  thumbnail?: string;
}) {
  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="aspect-square w-full overflow-hidden rounded bg-gray-100">
        {thumbnail && (
          <img
            src={thumbnail}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="mt-1 text-sm">{product.name}</div>
      <div className="font-bold">{product.price.toLocaleString()}원</div>
    </Link>
  );
}
```

- [ ] **Step 2: 문의 버튼(설정값 기반, 빈 항목은 숨김)**

```tsx
// components/customer/ContactButtons.tsx
import type { SiteSettings } from "@/lib/supabase/types";

export function ContactButtons({ settings }: { settings: SiteSettings }) {
  const items: { href: string; label: string }[] = [];
  if (settings.kakao_channel_url)
    items.push({ href: settings.kakao_channel_url, label: "💬 카톡 문의" });
  if (settings.phone)
    items.push({ href: `tel:${settings.phone}`, label: "📞 전화" });
  if (settings.instagram) {
    const ig = settings.instagram.startsWith("http")
      ? settings.instagram
      : `https://instagram.com/${settings.instagram.replace(/^@/, "")}`;
    items.push({ href: ig, label: "📷 인스타" });
  }
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-black py-3 text-center text-white"
        >
          {it.label}
        </a>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 이미지 슬라이더(간단 스크롤 스냅)**

```tsx
// components/customer/ImageSlider.tsx
import type { ProductImage } from "@/lib/supabase/types";

export function ImageSlider({ images }: { images: ProductImage[] }) {
  if (images.length === 0) {
    return <div className="aspect-square w-full bg-gray-100" />;
  }
  return (
    <div className="flex w-full snap-x snap-mandatory overflow-x-auto">
      {images.map((img) => (
        <img
          key={img.id}
          src={img.image_url}
          alt=""
          className="aspect-square w-full flex-none snap-center object-cover"
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 타입체크 + 커밋**

Run: `npx tsc --noEmit` → 에러 없음.

```bash
git add components/customer
git commit -m "feat(customer): 상품카드/문의버튼/이미지슬라이더 컴포넌트"
```

### Task 20: 메인(랜딩) 페이지

**Files:**

- Modify: `app/(customer)/page.tsx`

- [ ] **Step 1: 메인 페이지 구현**

```tsx
// app/(customer)/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/settings";

export default async function HomePage() {
  const supabase = await createClient();
  const s = await getSettings(supabase);
  return (
    <main className="mx-auto max-w-md p-4 text-center">
      {s.logo_url ? (
        <img
          src={s.logo_url}
          alt={s.shop_name}
          className="mx-auto my-4 h-16 object-contain"
        />
      ) : (
        <h1 className="my-4 text-2xl font-bold">{s.shop_name || "쇼핑몰"}</h1>
      )}
      {s.banner_url && (
        <img
          src={s.banner_url}
          alt=""
          className="my-4 w-full rounded object-cover"
        />
      )}
      {s.intro && <p className="my-4 text-gray-600">{s.intro}</p>}
      <Link
        href="/menu"
        className="mt-6 block rounded bg-black py-4 text-lg font-medium text-white"
      >
        📂 메뉴 보기 →
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: 수동 검증**

설정에서 입력한 로고/배너/소개가 메인에 반영되는지, "메뉴 보기"가 `/menu`로 이동하는지 확인.

- [ ] **Step 3: Commit**

```bash
git add "app/(customer)/page.tsx"
git commit -m "feat(customer): 메인(랜딩) 페이지"
```

### Task 21: 메뉴 페이지(카테고리 탭 + 그리드)

**Files:**

- Create: `app/(customer)/menu/page.tsx`, `lib/data/products.ts` (썸네일 헬퍼 추가)

- [ ] **Step 1: 카테고리별 대표 썸네일 헬퍼 추가**

`lib/data/products.ts`에 append:

```ts
// lib/data/products.ts (append)
export async function getThumbnailMap(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Record<string, string>> {
  if (productIds.length === 0) return {};
  const { data, error } = await supabase
    .from("product_images")
    .select("product_id,image_url,sort_order")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as {
    product_id: string;
    image_url: string;
  }[]) {
    if (!map[row.product_id]) map[row.product_id] = row.image_url;
  }
  return map;
}
```

> mock-supabase에 `.in()` 체이닝이 없으므로, 이 함수는 단위 테스트 대신 통합 수동 검증으로 확인한다(mock 확장은 불필요한 비용).

- [ ] **Step 2: 메뉴 페이지(탭은 쿼리스트링 `?cat=`로 구현)**

```tsx
// app/(customer)/menu/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data/categories";
import {
  getVisibleProductsByCategory,
  getThumbnailMap,
} from "@/lib/data/products";
import { ProductCard } from "@/components/customer/ProductCard";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const supabase = await createClient();
  const categories = await getCategories(supabase);
  const activeCat = cat ?? null;
  const products = await getVisibleProductsByCategory(supabase, activeCat);
  const thumbs = await getThumbnailMap(
    supabase,
    products.map((p) => p.id),
  );

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex gap-2 overflow-x-auto">
        <Tab href="/menu" active={!activeCat} label="전체" />
        {categories.map((c) => (
          <Tab
            key={c.id}
            href={`/menu?cat=${c.id}`}
            active={activeCat === c.id}
            label={c.name}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} thumbnail={thumbs[p.id]} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="py-10 text-center text-gray-500">상품이 없습니다.</p>
      )}
    </main>
  );
}

function Tab({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1 text-sm whitespace-nowrap ${
        active ? "bg-black text-white" : "bg-white"
      }`}
    >
      {label}
    </Link>
  );
}
```

- [ ] **Step 3: 수동 검증**

관리자에서 카테고리/상품(노출 on) 등록 후 `/menu`에서 탭 전환·그리드·썸네일 확인. 노출 off 상품은 안 보여야 함.

- [ ] **Step 4: Commit**

```bash
git add "app/(customer)/menu/page.tsx" lib/data/products.ts
git commit -m "feat(customer): 메뉴 페이지(카테고리 탭+상품 그리드)"
```

### Task 22: 상품 상세 페이지

**Files:**

- Create: `app/(customer)/products/[id]/page.tsx`

- [ ] **Step 1: 상세 페이지 구현**

```tsx
// app/(customer)/products/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getProductWithImages } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import { ImageSlider } from "@/components/customer/ImageSlider";
import { ContactButtons } from "@/components/customer/ContactButtons";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await getProductWithImages(supabase, id);
  if (!product || !product.is_visible) notFound();
  const settings = await getSettings(supabase);

  return (
    <main className="mx-auto max-w-md pb-8">
      <ImageSlider images={product.images} />
      <div className="space-y-3 p-4">
        <h1 className="text-lg font-bold">{product.name}</h1>
        <div className="text-xl font-extrabold">
          {product.price.toLocaleString()}원
        </div>
        <p className="whitespace-pre-wrap text-gray-700">
          {product.description}
        </p>
        <div className="pt-4">
          <ContactButtons settings={settings} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 수동 검증**

`/menu`에서 상품 클릭 → 상세 진입, 사진 슬라이드/설명/가격/문의버튼 확인. 노출 off 또는 없는 id는 404.

- [ ] **Step 3: Commit**

```bash
git add "app/(customer)/products"
git commit -m "feat(customer): 상품 상세 페이지"
```

---

## Phase 8 — 마무리

### Task 23: 루트 레이아웃 메타데이터 & 모바일 뷰포트

**Files:**

- Modify: `app/layout.tsx`

- [ ] **Step 1: 레이아웃 메타/뷰포트 설정**

```tsx
// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "쇼핑몰",
  description: "상품 카탈로그",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "chore: 루트 레이아웃 메타데이터/모바일 뷰포트"
```

### Task 24: 전체 테스트 & 빌드 검증

- [ ] **Step 1: 전체 단위 테스트**

Run: `npm test`
Expected: 모든 테스트 PASS (validation, upload, data 계층).

- [ ] **Step 2: 타입체크 & 프로덕션 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 타입 에러 없음, 빌드 성공.

- [ ] **Step 3: 통합 스모크(수동)**

순서대로 확인: 관리자 로그인 → 설정 저장 → 카테고리 추가 → 상품 등록(노출 on) → 고객 `/` → `/menu` 노출 확인 → 상세 → 노출 off 시 미표시.

- [ ] **Step 4: Commit (변경 있으면)**

```bash
git add -A && git commit -m "test: 전체 테스트/빌드 검증" || echo "변경 없음"
```

### Task 25: 배포 문서

**Files:**

- Create: `README.md`

- [ ] **Step 1: README 작성**

```markdown
# shopmall — 상품 카탈로그 웹

## 로컬 실행

1. `npm install`
2. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
3. Supabase에 `supabase/migrations/*.sql` 적용 (`npx supabase db push` 또는 대시보드 SQL 에디터)
4. Supabase Authentication에서 **관리자 계정 1개 수동 생성** (회원가입 UI 없음)
5. `npm run dev`

## 배포 (Vercel)

- Vercel 프로젝트에 위 두 환경변수 등록 후 배포
- 이미지 도메인: Supabase Storage 공개 URL 사용

## 구조

- 고객: `/`, `/menu`, `/products/[id]`
- 관리자: `/admin/login`, `/admin/settings`, `/admin/categories`, `/admin/products`
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README(로컬 실행/배포/관리자 계정 안내)"
```

---

## Self-Review (작성자 점검 결과)

**Spec 커버리지**

- 메인(랜딩)+메뉴 진입 버튼 → Task 20 ✅
- 메뉴(카테고리 탭+그리드) → Task 21 ✅
- 상품 상세(슬라이드/설명/가격/문의) → Task 22 ✅
- 관리자 로그인/단일계정/가드 → Task 12,13 ✅
- 사이트 설정(로고/배너/가게명/소개/카톡·전화·인스타) → Task 15 ✅
- 카테고리 CRUD(삭제 restrict) → Task 6,11,16 ✅
- 상품 CRUD + 사진 여러 장 + 노출 on/off → Task 10,17,18 ✅
- 데이터/Storage/RLS → Task 5,6 ✅
- 검증/에러처리 → Task 8,14, 각 액션 ✅
- 테스트 전략(데이터·액션·가드) → Task 8~11,14,24 ✅

**미루는 항목(명시)**: 카테고리 드래그 순서변경은 MVP 이후(Task 16 비고). `getThumbnailMap`/`getProductWithImages`의 `.in()`·`.single()` 일부 경로는 단위 mock 대신 수동 통합 검증(Task 9,21 비고).

**타입 일관성**: `ProductWriteInput`(name/price/categoryId/description/isVisible)이 `createProduct`/`updateProduct`/`saveProduct`에서 일치. `ProductWithImages`가 데이터·폼·상세에서 동일 사용. 확인 완료.
