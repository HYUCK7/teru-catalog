# 주문하기 기능 설계

작성일: 2026-06-10

## 배경 / 목적

디저트(케이크) 가게 카탈로그에 **주문하기** 기능을 추가한다. 손님이 상품 상세에서
주문서를 작성하면 주문이 서버 DB에 저장되고, 사장님은 관리자 화면에서 주문 목록을
확인하고 처리 완료를 체크한다.

"카카오톡으로 주문 전송"을 원래 검토했으나, 웹에서 특정인에게 카카오톡 메시지를
자동 전송하는 공개 API는 없다(알림톡은 사업자 채널·템플릿 승인·유료 외부서비스 필요).
따라서 **DB 저장 + 관리자 확인 방식(C)** 으로 결정했다. 카카오 채널 링크는 접수완료
화면의 문의 버튼으로만 활용한다.

## 범위

- **단일 상품 주문**: 장바구니 없음. 상품 상세의 「주문하기」 버튼 → 그 상품 1건 주문.
- **관리자 관리**: 목록 + 완료 체크(상태 = 신규/완료 2단계). 별도 상태 머신 없음.
- 배송 없음(픽업 전용) → 주소 필드 없음.

## 데이터 모델 — 새 테이블 `orders`

마이그레이션: `supabase/migrations/0005_orders.sql`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | uuid PK, default `gen_random_uuid()` | |
| `product_id` | uuid FK → products(id) `on delete set null` | 어떤 디저트인지 |
| `product_name` | text not null | 주문 시점 상품명 스냅샷(상품 변경/삭제돼도 내역 보존) |
| `quantity` | int not null default 1 | 수량(≥ 1) |
| `customer_name` | text not null | 주문자 이름 |
| `phone` | text not null | 연락처 |
| `pickup_date` | date not null | 픽업 날짜 |
| `pickup_time` | text not null | 픽업 시간(native `time`, "HH:MM" 형식) |
| `lettering` | text not null default `''` | 레터링 문구(선택) |
| `request_memo` | text not null default `''` | 추가 요청사항(선택) |
| `is_done` | boolean not null default false | 완료 체크 |
| `created_at` | timestamptz not null default `now()` | 접수 시각 |

인덱스: `create index on orders (created_at desc)` (관리자 목록 최신순 조회용).

## RLS 정책

기존 패턴(공개 읽기 / 인증 쓰기)과 달리, orders 는 **공개 생성 / 관리자 조회**다.

- 누구나 주문 생성: `for insert to anon, authenticated with check (true)`
- 관리자만 조회: `for select to authenticated using (true)`
- 관리자만 수정(완료 토글): `for update to authenticated using (true) with check (true)`
- 관리자만 삭제: `for delete to authenticated using (true)`
- **공개 select 정책 없음** → 손님은 자기/남의 주문을 조회할 수 없고 생성만 가능.

## 손님 흐름

1. 상품 상세(`app/(customer)/products/[id]/page.tsx`)에 **「주문하기」 버튼** 추가
   (기존 `ContactButtons` 위에 배치).
2. 주문서 페이지 `app/(customer)/products/[id]/order/page.tsx`(서버 컴포넌트):
   - 상품을 조회해 상품명·가격을 상단에 표시(자동 전달).
   - 폼은 클라이언트 컴포넌트 `components/customer/OrderForm.tsx`.
   - 입력: 주문자 이름, 연락처, 수량(number), 픽업 날짜(native `date`),
     픽업 시간(native `time`), 레터링 문구(선택), 추가 요청사항(선택, textarea).
3. 제출 → 서버액션 `submitOrder` 가 검증 후 DB 저장 → `app/(customer)/order/complete/page.tsx`
   접수완료 안내로 이동. 완료 화면에는 가게 카카오 채널 문의 버튼(설정값 있으면) 표시.

폼 상태는 기존 `saveProduct` 와 동일하게 `useActionState`(`_prev`, `formData`) 패턴 사용.
검증 실패 시 필드별 에러 메시지 반환.

## 관리자 흐름

- `app/admin/orders/page.tsx`(서버 컴포넌트): `getOrders` 로 최신순 조회 →
  `components/admin/OrderList.tsx` 에 전달.
- 각 주문 카드: 상품명·수량·주문자·연락처·픽업 일시·레터링·요청사항·접수시각 표시 +
  **「완료」 토글 버튼**. 완료된 주문은 흐리게(muted) 처리.
- `toggleOrderDone` 서버액션이 `is_done` 토글 후 `/admin/orders` revalidate.
- `components/admin/AdminNav.tsx` 에 "주문" 링크 추가.

## 파일 구조 (기존 패턴 준수)

- `supabase/migrations/0005_orders.sql` — 테이블 + 인덱스 + RLS
- `lib/supabase/types.ts` — `Order` 타입 추가
- `lib/data/orders.ts` — `createOrder`, `getOrders`, `setOrderDone`
- `lib/validation.ts` — `validateOrderInput`
- `actions/orders.ts` — `submitOrder`, `toggleOrderDone`
- `components/customer/OrderForm.tsx`
- `components/admin/OrderList.tsx`
- `app/(customer)/products/[id]/order/page.tsx`
- `app/(customer)/order/complete/page.tsx`
- 기존 상품 상세 페이지 / AdminNav 수정

## 검증 규칙 (`validateOrderInput`)

- `customer_name`: 공백 불가 → "주문자 이름을 입력하세요."
- `phone`: 공백 불가 → "연락처를 입력하세요."
- `quantity`: 정수, ≥ 1 → "수량은 1개 이상이어야 합니다."
- `pickup_date`: 공백 불가 → "픽업 날짜를 선택하세요."
- `pickup_time`: 공백 불가 → "픽업 시간을 선택하세요."
- `lettering`, `request_memo`: 선택(검증 없음)

## 테스트 (vitest, 기존 패턴)

- `lib/data/orders.test.ts` — `createOrder` insert/에러, `getOrders` 최신순/에러,
  `setOrderDone` 호출/에러 (mock supabase 클라이언트 사용).
- `lib/validation.test.ts` 에 `validateOrderInput` 케이스 추가
  (필수 누락, 수량 0/음수/소수, 정상).

## 에러 처리

- 데이터 함수는 supabase 에러 시 `throw new Error(error.message)` (기존 패턴 동일).
- 서버액션 검증 실패 시 `{ ok: false, errors }` 반환, 폼에서 필드별 표시.

## 비범위 (YAGNI)

- 장바구니 / 다상품 주문
- 주문 상태 다단계(신규→확인→완료) — 완료 체크 2단계만
- 결제 연동, 배송/주소
- 카카오 알림톡 자동 발송
- 손님용 주문 조회 화면
