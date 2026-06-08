# /menu 카테고리 클라이언트 필터링 설계

## 배경 / 문제

`/menu` 페이지는 카테고리 탭을 누를 때마다 느리다. 원인:

1. 탭이 `<Link href="/menu?cat=...">`라서 매 클릭마다 서버 왕복(서버 컴포넌트 전체 재렌더).
2. `export const dynamic = "force-dynamic"`로 캐시가 비활성화되어 매 요청마다 새로 렌더.
3. DB 쿼리 3개(`getCategories`, `getVisibleProductsByCategory`, `getThumbnailMap`)가 순차 실행되고, 그중 카테고리는 클릭마다 바뀌지 않는데도 매번 재조회.

즉 카테고리 클릭 = 서버 왕복 + DB 직렬 조회. 체감 지연 발생.

## 목표

- 탭 전환 시 DB 왕복 0회 — 클라이언트에서 메모리 필터링.
- URL(`?cat=...`)은 동기화 유지 → 링크 공유·뒤로가기·새로고침 시 선택 카테고리 보존.
- 새 페이지 진입 시에는 최신 데이터 반영(관리자 수정 즉시 반영).

## 설계

### 서버 컴포넌트 `MenuPage` (페이지 로드 시 1회)

- `getCategories`, `getVisibleProductsByCategory(supabase, null)`(= 전체 visible 상품)을 `Promise.all`로 병렬 조회.
- 전체 상품 id로 `getThumbnailMap` 조회(기존 함수 재사용).
- `force-dynamic` 유지 — 진입 시 항상 최신.
- 초기 `cat` 값과 `categories`, `products`, `thumbnails`를 클라이언트 컴포넌트로 전달.

### 클라이언트 컴포넌트 `MenuClient` (신규, `"use client"`)

- props: `categories`, `products`(전체), `thumbnails`, `initialCat`.
- `activeCat` state를 `initialCat`으로 초기화.
- `useMemo`로 `activeCat` 기준 상품 필터링(`null`이면 전체).
- 탭 클릭 시: `setActiveCat(id)` + `window.history.pushState`로 URL을 `/menu` 또는 `/menu?cat=<id>`로 갱신 → **Next 네비게이션/서버 재요청 없음**.
- `popstate` 리스너로 뒤로가기/앞으로가기 시 URL→`activeCat` 동기화.
- 탭, 상품 그리드, 빈 상태(`상품이 없습니다.`) 렌더를 담당.
- `BackButton`은 `MenuPage`(서버 컴포넌트)에 그대로 둔다 — 필터링과 무관하므로 클라이언트로 내리지 않는다.

### 데이터 흐름

페이지 진입 → 1회 fetch(병렬) → 이후 탭 전환은 전부 메모리 필터(DB 왕복 0).

## 테스트 (TDD)

`MenuClient` 단위 테스트(`components/customer/` 또는 페이지 인접 위치, 기존 `BackButton.test.tsx` 패턴):

- 초기 `initialCat`에 해당하는 상품만 렌더되는지.
- 탭 클릭 시 해당 카테고리 상품만 남는지(필터링 동작).
- 탭 클릭 시 `window.history.pushState`가 올바른 URL로 호출되는지(`pushState` 스파이).
- '전체' 탭 클릭 시 전 상품 복귀 + URL이 `/menu`인지.

## 범위 밖 (YAGNI)

- 페이지네이션/무한스크롤 (현재 카탈로그 규모에서 불필요).
- 서버 캐싱 전략 변경(`force-dynamic` 유지).
- 검색/정렬 기능.
