# 상품 이미지 "+" 타일 다중 등록 UX 설계

## 배경 / 문제

관리자 상품 추가/편집 화면에서 한 상품에 여러 장의 사진을 등록할 수 있다.
데이터 계층과 폼은 이미 다중 이미지를 지원한다:

- `product_images` 테이블 + `sort_order` 컬럼
- `getProductWithImages`가 이미지 배열 반환, `ProductForm`이 기존 이미지 그리드 렌더
- `saveProduct`가 `new_image_urls`를 받아 여러 행을 DB에 연결
- 고객 화면은 `ImageSlider`로 여러 장 노출

빠진 것은 **UX뿐**이다. 현재 `ImageUploader`는 평범한 `<input type="file">`이라
한 번에 한 장씩만 올릴 수 있고, 썸네일 그리드와 시각적으로 분리되어 있어
"사진을 더 추가한다"는 행동이 직관적이지 않다.

## 목표

- 썸네일 그리드 끝에 점선 "+" 타일을 두어, 클릭하면 파일 선택 → 그리드에 사진이 누적되도록 한다.
- 한 장씩 추가하되, "+"를 반복해서 눌러 여러 장을 등록할 수 있다.
- 기존 동작은 모두 유지: 선택 즉시 스토리지 업로드, "저장" 시 상품에 DB로 연결.

## 결정 사항 (확정)

- **업로드 타이밍: 현재 방식 유지** — 파일 선택 즉시 Supabase 스토리지에 업로드하고,
  "저장" 클릭 시 `saveProduct`가 URL들을 `product_images`에 연결한다.
  (대안인 "저장 시점 일괄 업로드"는 폼 제출 흐름을 직접 제어해야 해 복잡도가 크고,
  고아 파일 방지라는 이익이 관리자 전용 도구에선 작아 채택하지 않음.)
- **범위: "+" 타일 UI 추가 + 한 장씩 업로드** — 다중 선택(한 번에 여러 파일)·드래그 순서변경은 범위 밖.
- **서버/데이터 계층 변경 없음** — `saveProduct`, `lib/data/products.ts`, `lib/upload.ts` 그대로.

## 설계

### `components/admin/ImageUploader.tsx` (변경)

평범한 파일 입력을 썸네일 그리드에 어울리는 "+" 타일로 교체한다.

- 보이는 `<input type="file">`을 숨기고(`sr-only` 또는 `hidden`), `<label>`로 감싼 "+" 타일을 렌더.
- 타일 스타일: 기존 썸네일과 동일한 크기(`h-20 w-20`), `rounded`, 점선 테두리(`border-2 border-dashed`),
  가운데 큰 "+" 기호, hover/포커스 시 약한 강조.
- 업로드 중(`busy`)에는 타일을 비활성화하고 "+" 대신 "..." 또는 로딩 표시.
- 에러는 타일 아래 작게(`text-sm text-red-600`) 표시.
- props 시그니처(`bucket`, `pathPrefix`, `onUploaded`)와 업로드 로직(`handleChange` → `uploadImage` → `onUploaded`)은 **그대로 유지**.
- 한 장씩 동작 유지: `event.target.files?.[0]`만 처리. (`multiple` 미적용.)
- 같은 파일을 연속 선택해도 `onChange`가 다시 발화하도록, 처리 후 `event.target.value = ""`로 초기화.

### `components/admin/ProductForm.tsx` (변경)

"+" 타일을 별도 영역이 아니라 **썸네일 그리드 안쪽**에 배치한다.

- 기존/신규 썸네일을 렌더하는 `flex flex-wrap gap-2` 그리드의 **마지막 요소로 `<ImageUploader>`를 이동**.
- 렌더 순서: `기존 이미지(x 삭제 버튼) → newUrls 미리보기(초록 테두리) → "+" 타일`.
- `newUrls` 상태, `new_image_urls` hidden input, `onUploaded` 누적 로직은 그대로.
- `<Label>상품 사진</Label>` 유지.

### 데이터 흐름 (변경 없음)

"+" 타일 클릭 → 파일 선택 → 즉시 스토리지 업로드 → URL을 `newUrls`에 누적(미리보기) →
"저장" 클릭 → `saveProduct`가 `new_image_urls`를 `product_images`에 연결.

### 기존 이미지 삭제 (변경 없음)

편집 화면의 기존 이미지 x 버튼은 지금처럼 `removeImage` 서버 액션으로 즉시 삭제.
(이미 저장된 이미지라 신규 업로드 타이밍과 별개.)

## 테스트 (TDD)

`ImageUploader` 단위 테스트(기존 컴포넌트 테스트 패턴 따름):

- "+" 타일(파일 입력)이 렌더되는지.
- 파일 선택 시 `uploadImage`가 호출되고 성공하면 `onUploaded`가 받은 URL로 호출되는지(`uploadImage` 모킹).
- 업로드 실패 시 에러 메시지가 표시되고 `onUploaded`는 호출되지 않는지.
- 업로드 중 입력이 비활성화되는지.

`ProductForm`은 기존 테스트가 있으면 그리드 내 "+" 타일 위치/렌더만 확인(없으면 신규 추가는 범위 밖, 수동 확인).

## 범위 밖 (YAGNI)

- 한 번에 여러 파일 선택(`multiple`).
- 드래그로 이미지 순서(대표 이미지) 변경.
- 저장 시점 일괄 업로드 / 고아 파일 자동 정리.
- 기존 이미지 삭제 타이밍 변경.
