# 디자인 선택 기능 설계

2026-06-11

## 개요

케이크처럼 디자인이 여러 가지인 상품의 주문서에서, 주문자가 상품 이미지 중 하나를 "디자인"으로 선택하게 한다. 선택한 디자인은 주문에 스냅샷으로 저장되어 관리자 주문 목록에서 썸네일로 보인다.

## 표시 조건

디자인 선택 섹션은 아래 두 조건을 **모두** 만족할 때만 주문서에 나타난다.

1. 상품이 속한 카테고리의 `design_enabled`가 `true`
2. 상품 이미지가 **2장 이상**

카테고리 이름("케이크")으로 구분하지 않는다. 이름은 관리자가 바꿀 수 있는 데이터라서, 카테고리 행에 명시적인 토글을 둔다.

## 동작

- 주문서(`/products/[id]/order`)에서 주문자 이름 입력란 **위에** "디자인 선택" 섹션을 표시
- 상품 이미지 전체를 그리드로 나열, 라디오 방식으로 **정확히 1개만** 선택 가능
- 선택은 **필수** — 미선택 시 서버 검증에서 에러("디자인을 선택해주세요.")
- 서버는 선택값이 실제 해당 상품의 이미지 URL인지 검증한다
- 표시 조건을 만족하지 않는 상품은 섹션이 보이지 않고, 검증도 하지 않는다

## 데이터 모델

마이그레이션 `0009_design_selection.sql`:

```sql
alter table categories
  add column if not exists design_enabled boolean not null default false;

alter table orders
  add column if not exists design_image_url text not null default '';
```

- `orders.design_image_url`은 **URL 스냅샷**이다. `product_images.id` FK가 아니다.
  주문은 기존에도 `product_name`, `selected_choices`를 스냅샷으로 저장한다.
  관리자가 이미지를 삭제·교체해도 주문 기록은 유지된다.

## 컴포넌트 / 변경 지점

| 위치 | 변경 |
|---|---|
| `lib/supabase/types.ts` | `Category.design_enabled`, `Order.design_image_url` 추가 |
| `lib/design-selection.ts` (신규) | 순수 로직: 표시 조건 판정, 선택값 검증 |
| `lib/data/categories.ts` | `getCategoryById`, `design_enabled` 업데이트 지원 |
| `lib/data/orders.ts` | `OrderWriteInput.designImageUrl` 추가, insert에 포함 |
| `actions/categories.ts` | 디자인 토글 서버 액션 |
| `components/admin/CategoryManager.tsx` | 카테고리 행에 "디자인 선택 사용" 토글 |
| `app/(customer)/products/[id]/order/page.tsx` | 카테고리 조회 후 표시 여부 계산, OrderForm에 전달 |
| `components/customer/OrderForm.tsx` | 디자인 선택 섹션 (주문자 이름 위) |
| `components/customer/DesignPicker.tsx` (신규) | 이미지 그리드 라디오 UI |
| `actions/orders.ts` | `submitOrder`에서 디자인 검증 + 저장 |
| `components/admin/OrderList.tsx` | `design_image_url` 있으면 썸네일 표시 |

## 순수 로직 (lib/design-selection.ts)

```ts
isDesignSelectionRequired(designEnabled: boolean, imageCount: number): boolean
// designEnabled && imageCount >= 2

validateDesignSelection(selected: string, imageUrls: string[]):
  { ok: true; url: string } | { ok: false; error: string }
// 미선택 → "디자인을 선택해주세요."
// imageUrls에 없는 값 → 에러
```

## 테스트

- `lib/design-selection.test.ts` — 표시 조건, 검증 로직 단위 테스트
- `lib/data/categories.test.ts` / `lib/data/orders.test.ts` — mock-supabase로 data 레이어 테스트
- 기존 패턴(TDD, mock-supabase) 준수. `npm test`는 Node 20.19+ 필요.

## 범위 제외 (YAGNI)

- 상품 단위 디자인 토글 (카테고리 단위로 충분)
- 디자인별 추가 금액
- 관리자 주문 목록 외 다른 곳(주문 완료 페이지 등)에서의 디자인 표시
