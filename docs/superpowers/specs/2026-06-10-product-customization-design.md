# 상품 커스텀 주문 설계

**작성일:** 2026-06-10 (개정: 2026-06-11)

## 목표

주문서에서 손님이 디저트의 맛/옵션을 직접 고를 수 있게 한다. 카테고리별로 관리자가 등록한 항목을 노출하며, 상품마다 맛 선택·옵션 선택을 각각 켤 수 있다. 두 가지 모두 다중선택이며 한 상품에서 동시에 사용할 수 있다. 일부 항목은 가격을 추가할 수 있다.

## 핵심 결정 (확정)

- **항목(맛/옵션)은 카테고리별로 등록**한다. 같은 카테고리의 상품들이 동일한 항목 풀을 공유한다.
- 각 항목은 **종류(`kind`)** 를 가진다: `'flavor'`(맛) / `'option'`(옵션). 카테고리는 맛 목록과 옵션 목록을 각각 가질 수 있다.
- **상품은 맛/옵션을 독립적으로 켠다**: `flavor_enabled`, `option_enabled` 두 토글. 둘 다 끄면 단일 품목(커스텀 없음).
- **맛·옵션 모두 다중선택**(개수 제한 없음). 둘 다 켜져 있으면 손님은 두 그룹에서 자유롭게 고른다.
- **모든 항목은 텍스트 라벨 + 직접 입력한 추가 금액(원)** 을 가진다. 맛도 가격을 붙일 수 있다.
- 손님 주문 시 **선택은 필수 아님**(선택). 선택한 항목은 가격·종류까지 **스냅샷으로 주문에 저장**해 과거 주문을 보존한다.
- 가격 변조 방지를 위해 서버에서 카테고리 정식 항목과 대조 후 **서버 측 데이터로 스냅샷을 재구성**한다.

## 데이터 모델

### 새 테이블: `category_choices`

카테고리별 맛/옵션 항목.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `category_id` | uuid FK → `categories(id)` on delete cascade | 소속 카테고리 |
| `kind` | text not null | `'flavor'`(맛) / `'option'`(옵션) |
| `label` | text not null | 항목 이름 (예: "딸기", "2호 사이즈") |
| `price` | int not null default 0 | 추가 금액(원), 0 이상 |
| `sort_order` | int not null default 0 | 정렬 |
| `created_at` | timestamptz default now() | |

RLS: **public read**(손님 주문서에서 필요) + **admin write**(`to authenticated`).

### `products` 컬럼 추가

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `flavor_enabled` | boolean not null default false | 맛 다중선택 노출 여부 |
| `option_enabled` | boolean not null default false | 옵션 다중선택 노출 여부 |

> 둘 다 false = 단일 품목(커스텀 없음).

### `orders` 컬럼 추가

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `selected_choices` | jsonb not null default `'[]'` | 선택 항목 스냅샷 `[{ "label": string, "price": number, "kind": "flavor"\|"option" }]` |

## 컴포넌트 / 데이터 흐름

### 관리자 — 카테고리 항목 관리
- 위치: `/admin/categories` (`CategoryManager` 내부 각 카테고리 행에 항목 관리 영역 추가).
- "맛 항목"과 "옵션 항목" **두 그룹**으로 나눠 각각 추가·수정·삭제(label + 가격).
- `blocked_times` 관리 패턴과 동일. 정렬은 (카테고리, 종류)별 추가 순서로 단순화.

### 관리자 — 상품 폼
- `ProductForm`의 `노출하기` 아래에 체크박스 **두 개**: "맛 선택 받기 (다중)" → `flavor_enabled`, "옵션 선택 받기 (다중)" → `option_enabled`.
- 항목 자체는 카테고리에서 관리한다는 안내문.

### 손님 — 주문서
- 새 컴포넌트 `ProductCustomizer`. props: `flavorEnabled`, `optionEnabled`, `flavorChoices`, `optionChoices`, `basePrice`.
- 켜진 종류마다 **다중선택 그룹**을 렌더(맛 그룹 / 옵션 그룹). 둘 다 켜지면 둘 다 표시.
- 가격 > 0인 항목은 `라벨 (+3,000원)` 표시. 선택 시 추가금액 합계 + 예상 합계를 실시간 표시.
- 선택값은 hidden input으로 종류별 전송: `selected_flavor`(다중), `selected_option`(다중).

### 서버 — `submitOrder`
1. 상품의 `category_id`로 카테고리 항목을 조회 후 `kind`로 분리.
2. `flavor_enabled`이면 `selected_flavor`를 맛 목록과 대조, `option_enabled`이면 `selected_option`을 옵션 목록과 대조. 정식 항목이 아니면 에러.
3. 정식 항목 데이터로 `[{label, price, kind}]` 스냅샷을 **서버에서 재구성**(맛 + 옵션 합침).
4. `createOrder`에 `selectedChoices` 전달 → `orders.selected_choices` 저장.
- 관리자 주문 목록(`OrderList`)에 선택 항목과 추가금액 표시.

## 순수 로직 (`lib/customization.ts`)
테스트 대상 순수 함수:
- `CHOICE_KINDS` 상수 및 `isChoiceKind(value)`.
- `validateChoiceSelection(selectedLabels, available)`: 한 종류의 다중선택 검증 + 스냅샷 생성. 반환 `{ ok, snapshot }` 또는 `{ ok: false, error }`. 개수 제한 없음, 중복 라벨은 한 번만, 미존재 라벨은 에러.
- `sumChoicePrice(snapshot)`: 추가 금액 합계.

## 테스트 범위 (저장소 관례)
- 데이터 함수 + 순수/검증 로직만 단위 테스트. UI 컴포넌트는 테스트하지 않음.
- 대상: `lib/customization.ts`, `lib/data/category-choices.ts`.

## 마이그레이션
- `supabase/migrations/0007_customization.sql` 한 파일에 위 3가지 변경 포함.
- 적용은 사용자가 직접(SQL Editor 또는 `supabase db push`).
