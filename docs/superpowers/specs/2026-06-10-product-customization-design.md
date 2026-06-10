# 상품 커스텀 주문 설계

**작성일:** 2026-06-10

## 목표

주문서에서 손님이 디저트의 맛/옵션을 직접 고를 수 있게 한다. 카테고리별로 관리자가 등록한 항목을 노출하며, 상품마다 커스텀 방식(없음 / 맛 다중선택 / 옵션 단일선택)을 지정한다. 일부 항목은 가격을 추가할 수 있다.

## 핵심 결정 (확정)

- **항목(맛/옵션)은 카테고리별로 등록**한다. 같은 카테고리의 상품들이 동일한 항목 풀을 공유한다.
- **커스텀 방식은 상품마다 지정**한다: `none`(단일 품목) / `multi`(맛 다중선택) / `single`(옵션 단일선택).
- **모든 항목은 텍스트 라벨 + 직접 입력한 추가 금액(원)** 을 가진다. 맛(파이)도 가격을 붙일 수 있다.
- 손님 주문 시 **선택 항목은 필수 아님**(선택). 선택한 항목은 가격까지 **스냅샷으로 주문에 저장**해 과거 주문을 보존한다.
- 가격 변조를 막기 위해 서버에서 카테고리 정식 항목과 대조 후 **서버 측 데이터로 스냅샷을 재구성**한다.

## 데이터 모델

### 새 테이블: `category_choices`

카테고리별 맛/옵션 항목.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `category_id` | uuid FK → `categories(id)` on delete cascade | 소속 카테고리 |
| `label` | text not null | 항목 이름 (예: "딸기", "2호 사이즈") |
| `price` | int not null default 0 | 추가 금액(원), 0 이상 |
| `sort_order` | int not null default 0 | 정렬 |
| `created_at` | timestamptz default now() | |

RLS: **public read**(손님 주문서에서 필요) + **admin write**(`to authenticated`).

### `products` 컬럼 추가

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `custom_type` | text not null default `'none'` | `'none'` / `'multi'` / `'single'` |

### `orders` 컬럼 추가

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `selected_choices` | jsonb not null default `'[]'` | 선택 항목 스냅샷 `[{ "label": string, "price": number }]` |

## 컴포넌트 / 데이터 흐름

### 관리자 — 카테고리 항목 관리
- 위치: `/admin/categories` (`CategoryManager` 내부 각 카테고리 행에 항목 관리 영역 추가).
- 기능: 항목 추가(label + 가격), 삭제, 라벨/가격 인라인 수정.
- `blocked_times` 관리 패턴과 동일. 정렬은 추가 순서(append)로 단순화.

### 관리자 — 상품 폼
- `ProductForm`의 `노출하기` 아래에 "커스텀 주문 받기" 체크박스 + 체크 시 라디오(`맛 선택·다중` / `옵션 선택·단일`).
- 항목 자체는 카테고리에서 관리한다는 안내문.
- 미체크 시 `custom_type = 'none'` 저장.

### 손님 — 주문서
- 새 컴포넌트 `ProductCustomizer`. props: `customType`, `choices`(해당 카테고리 항목), `priceBase`(상품가).
- `none` → 렌더 없음 / `multi` → 체크박스(다중) / `single` → 라디오(단일).
- 가격 > 0인 항목은 `라벨 (+3,000원)` 표시. 선택 시 추가금액 합계 + 예상 합계를 실시간 표시.
- 선택값은 hidden input으로 라벨 배열을 전송(`selected_choice` 다중 필드).

### 서버 — `submitOrder`
1. 상품의 `category_id`로 카테고리 항목을 조회.
2. 폼에서 받은 선택 라벨이 정식 항목의 부분집합인지 검증. `single`이면 최대 1개, 미존재 라벨이 있으면 에러.
3. 정식 항목 데이터로 `[{label, price}]` 스냅샷을 **서버에서 재구성**.
4. `createOrder`에 `selectedChoices` 전달 → `orders.selected_choices` 저장.
- 관리자 주문 목록(`OrderList`)에 선택 항목과 추가금액 표시.

## 순수 로직 (`lib/customization.ts`)
테스트 대상 순수 함수:
- `CUSTOM_TYPES` 상수 및 `isCustomType(value)`.
- `validateSelectedChoices(customType, selectedLabels, choices)`: 유효성 검사 + 스냅샷 생성. 반환 `{ ok, snapshot, error? }`.
- `sumChoicePrice(snapshot)`: 추가 금액 합계.

## 테스트 범위 (저장소 관례)
- 데이터 함수 + 순수/검증 로직만 단위 테스트. UI 컴포넌트는 테스트하지 않음.
- 대상: `lib/customization.ts`, `lib/data/category-choices.ts`, `lib/validation.ts`(상품 custom_type 검증이 추가될 경우).

## 마이그레이션
- `supabase/migrations/0007_customization.sql` 한 파일에 위 3가지 변경 포함.
- 적용은 사용자가 직접(SQL Editor 또는 `supabase db push`).
