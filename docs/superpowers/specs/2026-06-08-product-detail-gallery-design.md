# 상품 상세 이미지 갤러리 설계

## 배경 / 문제

상품은 여러 장의 이미지를 가질 수 있다(`product_images` + `sort_order`).
현재 상태:

- **상품 리스트**: `getThumbnailMap`이 `sort_order` 오름차순으로 조회해 상품별 첫(0번째) 이미지를
  대표 썸네일로 반환하고, `ProductCard`가 이를 렌더한다. → 이미 0번째 이미지를 노출.
- **상품 상세**: `ImageSlider`가 모든 이미지를 동일 크기의 가로 스와이프 캐러셀로 보여준다.
  큰 대표 이미지와 나머지 이미지의 위계가 없다.

요청은 상세 화면을 **큰 대표 이미지 + 아래 작은 썸네일 줄(클릭 시 교체)** 형태로 바꾸는 것이다.

## 목표

- 상품 상세 진입 시 **0번째 이미지를 큰 이미지로** 노출.
- 큰 이미지 아래에 **나머지 이미지를 작은 썸네일로 나열**.
- 썸네일 클릭 시 큰 이미지가 해당 이미지로 **교체**된다.
- 상품 리스트는 지금처럼 항상 0번째 이미지를 대표로 노출(변경 없음).

## 핵심 규칙

- **큰 이미지** = 현재 선택된 이미지(`activeId`). 초기값은 `images[0]`(0번째).
- **썸네일 줄** = *현재 선택된 이미지를 제외한 나머지 전부*, `sort_order` 순.

이 한 규칙으로 요청과 UX 일관성이 모두 충족된다:

- 초기: 큰 이미지 = 0번째, 썸네일 줄 = `[1, 2, 3…]` (요청 그대로).
- 썸네일(예: 2번) 클릭 → 큰 이미지 = 2번, 썸네일 줄 = `[0, 1, 3…]`로 재계산.
- 즉 다른 이미지를 보는 순간 0번째가 자연스럽게 썸네일 줄로 내려가 **항상 다시 선택 가능**해진다
  (별도 "처음으로" 버튼이나 분기 없이 "교체" 동작이 성립).

## 설계

### `components/customer/ProductGallery.tsx` (신규, `"use client"`)

스와이프 캐러셀 `ImageSlider`를 대체하는 클릭형 갤러리.

- props: `images: ProductImage[]`
- state: `activeId: string` — 기본값 `images[0]?.id`
- 렌더 분기:
  - 이미지 0개 → 기존과 동일한 회색 placeholder (`aspect-square w-full bg-gray-100`).
  - 이미지 1개 → 큰 이미지만, 썸네일 줄 없음.
  - 이미지 2개 이상 → 큰 이미지 + 썸네일 줄.
- 큰 이미지: `aspect-square w-full object-cover` (기존 톤 유지). `activeId`에 해당하는 이미지를 렌더.
- 썸네일 줄: `images.filter((img) => img.id !== activeId)`를 `sort_order` 순으로,
  작은 정사각형(`h-16 w-16`, `rounded`, `object-cover`)으로 가로 나열.
  각 썸네일 클릭 시 `setActiveId(img.id)`.
- `alt`은 기존 `ImageSlider`와 동일하게 빈 문자열 유지(상세 페이지에 상품명 별도 노출됨).

### `app/(customer)/products/[id]/page.tsx` (변경)

- `import { ImageSlider }` → `import { ProductGallery }`.
- `<ImageSlider images={product.images} />` → `<ProductGallery images={product.images} />`.

### `components/customer/ImageSlider.tsx` (제거)

- 다른 곳에서 사용되지 않으므로 파일 삭제.

### 상품 리스트 / 데이터 계층 (변경 없음)

- `getThumbnailMap`, `ProductCard`, `getVisibleProductsByCategory` 그대로.
- 이미 0번째(최저 `sort_order`) 이미지를 대표로 노출하므로 요청 충족.
- 회귀만 확인.

## 데이터 흐름

서버 컴포넌트(`page.tsx`)가 `getProductWithImages`로 `sort_order` 순 이미지 배열을 받아
`ProductGallery`에 전달 → 클라이언트에서 `activeId` 상태로 큰 이미지/썸네일 줄을 파생 렌더.
서버/DB 변경 없음.

## 테스트 (TDD)

`components/customer/ProductGallery.test.tsx` (기존 컴포넌트 테스트 패턴 따름):

- 이미지 0개: placeholder 렌더, 큰 이미지/썸네일 없음.
- 이미지 1개: 큰 이미지 1개만, 썸네일 줄 없음.
- 이미지 여러 개: 큰 이미지 = `images[0]`, 썸네일 줄 = 나머지(개수 = 전체 - 1).
- 썸네일 클릭: 큰 이미지가 클릭한 이미지로 교체되고, 직전 큰 이미지가 썸네일 줄에 다시 나타남.

## 범위 밖 (YAGNI)

- 스와이프 / 드래그 제스처.
- 이미지 확대(라이트박스 / 줌).
- 자동 재생(carousel autoplay).
- 키보드 화살표 네비게이션.
- 데이터 계층 / 관리자 업로드 UX 변경.
