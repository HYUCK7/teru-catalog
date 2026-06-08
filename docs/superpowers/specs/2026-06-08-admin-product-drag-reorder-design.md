# 관리자 상품 리스트 드래그 정렬 설계

## 배경 / 문제

관리자 상품 관리 화면(`app/admin/products/page.tsx` → `ProductSortList`)은 이미 노출 순서
변경 기능을 가진다. 단, 현재 방식은 각 행의 **위/아래 화살표 버튼**(`ArrowUp`/`ArrowDown`)으로
한 칸씩 이동한 뒤 "노출 순서 저장"을 누르는 것이다.

요청은 각 행 **맨 앞에 드래그 핸들 아이콘**을 두고, 드래그해서 순서를 바꾸는 방식으로 교체하는 것이다.

## 결정 사항 (확정)

- **구현: `@dnd-kit` 라이브러리 사용** — 리스트 재정렬 표준 라이브러리. 터치/키보드/접근성 지원,
  부드러운 드래그 애니메이션. (대안인 네이티브 HTML5 DnD는 의존성이 없지만 터치/모바일 지원이
  약하고 직접 처리할 엣지 케이스가 많아 채택하지 않음.)
- **위/아래 화살표 제거** — 드래그 핸들로만 순서를 변경한다.
- **저장 흐름 유지** — 드롭 시 자동 저장이 아니라, 기존처럼 "노출 순서 저장" 버튼 제출 시
  `saveProductSortOrders`로 반영한다.

## 설계

### 의존성 추가

`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

### `components/admin/ProductSortList.tsx` (재작성)

- 기존 `moveByIndex`와 위/아래 화살표 `<Button>`(`ArrowUp`/`ArrowDown`) 제거.
- 전체 구조:
  - `<form action={saveProductSortOrders}>` + 하단 "노출 순서 저장" `<Button type="submit">` **유지**.
  - `useState(products)`로 `items` 상태 보유.
  - `<DndContext>` 에 센서 등록: `PointerSensor`(터치/마우스 공용) + `KeyboardSensor`
    (`sortableKeyboardCoordinates`). `onDragEnd(event)`에서 `active.id !== over.id`이면
    `@dnd-kit/sortable`의 `arrayMove`로 `items` 재정렬.
  - `<SortableContext items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>`
    안에 각 상품 행을 렌더.
- 정렬된 `items` 순서대로 hidden `product_id`가 제출 → `saveProductSortOrders` /
  `updateProductSortOrders` **변경 없음**.
- 빈 목록: 기존 "등록된 상품이 없습니다." 메시지 유지.

### `SortableProductRow` (신규, 같은 파일 내 컴포넌트)

각 행이 `useSortable` 훅을 호출해야 하므로 행을 별도 컴포넌트로 분리한다.

- `const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id })`
- `setNodeRef`를 `<li>`에 부착, `style`로 `transform`(`CSS.Transform.toString(transform)`)·`transition` 적용,
  `isDragging` 시 `opacity`/`shadow`로 들린 느낌.
- **맨 앞 드래그 핸들**: `lucide-react`의 `GripVertical` 아이콘 버튼.
  - `{...attributes} {...listeners}`를 **핸들에만** 부착 → 행 전체가 아니라 핸들로만 드래그 시작.
  - `aria-label={`${product.name} 순서 변경 핸들`}`, `type="button"`, `cursor-grab`.
- 나머지 셀(이름 / 카테고리명 / 가격 / 노출·숨김 / 편집 링크)과
  `<input type="hidden" name="product_id" value={product.id} />`는 기존 그대로.

### 변경 없음

- `app/admin/products/page.tsx` — 그대로 `<ProductSortList products categoryNames />` 렌더.
- `actions/products.ts`의 `saveProductSortOrders`, `lib/data/products.ts`의 `updateProductSortOrders`.

## 테스트

`components/admin/ProductSortList.test.tsx`:

- 상품 수만큼 행이 렌더된다.
- 각 행에 드래그 핸들(`aria-label` "순서 변경 핸들")이 존재한다.
- hidden `product_id` input이 초기 순서대로 렌더된다.
- 빈 목록일 때 "등록된 상품이 없습니다." 메시지가 보인다.

실제 드래그 앤 드롭 인터랙션(드롭 후 순서 재정렬)은 jsdom의 포인터/레이아웃 한계로
단위 테스트 대신 **수동 확인**한다.

## 범위 밖 (YAGNI)

- 드롭 시 자동 저장.
- 카테고리별 그룹 단위 정렬.
- 다중 선택 드래그.
- 고객 화면 변경.
