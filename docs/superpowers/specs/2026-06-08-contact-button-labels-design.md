# 연락처 버튼 라벨 관리자 설정 — 설계

## 배경 / 목적

고객 화면의 연락처 버튼(`components/customer/ContactButtons.tsx`)은 현재 라벨이
하드코딩되어 있다 — `카톡 문의`, `전화`, `인스타`. 가게마다 다른 문구를 쓰고 싶을 수
있으므로, 세 버튼의 라벨을 관리자 사이트 설정(`/admin/settings`)에서 수정할 수 있게 한다.

## 범위

- 카톡 / 전화 / 인스타 **세 버튼 모두** 라벨 수정 가능.
- 라벨을 비워두면 코드에 정의된 기본값으로 폴백한다 → 기존 데이터/동작에 영향 없음.
- 버튼의 링크(연락처 값) 동작 자체는 변경하지 않는다. 라벨 텍스트만 추가한다.

## 데이터 모델

`site_settings` 테이블(단일 행, id=1)에 nullable 컬럼 3개 추가:

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `kakao_label` | `text` | null이면 기본값 `카톡 문의` |
| `phone_label` | `text` | null이면 기본값 `전화` |
| `instagram_label` | `text` | null이면 기본값 `인스타` |

마이그레이션 파일: `supabase/migrations/0003_contact_labels.sql`

```sql
alter table site_settings
  add column kakao_label text,
  add column phone_label text,
  add column instagram_label text;
```

기존 패턴(평면 컬럼)과 일관성을 유지한다. 기본값은 DB가 아닌 코드에서 폴백으로 처리한다.

## 기본 라벨 상수

기본 라벨을 한 곳에 정의해 폼 placeholder와 고객 화면 폴백에서 공유한다.

```ts
// components/customer/ContactButtons.tsx 또는 인접 모듈
export const DEFAULT_CONTACT_LABELS = {
  kakao: "카톡 문의",
  phone: "전화",
  instagram: "인스타",
} as const;
```

## 변경 단위별 설계

### 1. 타입 — `lib/supabase/types.ts`
`SiteSettings`에 `kakao_label: string | null`, `phone_label: string | null`,
`instagram_label: string | null` 추가.

### 2. 데이터 계층 — `lib/data/settings.ts`
변경 없음. `getSettings`는 `select("*")`, `updateSettings`는 `Partial<...>`이므로
새 필드를 자동으로 다룬다.

### 3. 관리자 액션 — `actions/settings.ts`
`updateSettings` 호출 시 세 필드를 추가로 읽어 `emptyToNull`로 처리:
```ts
kakao_label: emptyToNull(formData.get("kakao_label")),
phone_label: emptyToNull(formData.get("phone_label")),
instagram_label: emptyToNull(formData.get("instagram_label")),
```

### 4. 관리자 폼 — `components/admin/SettingsForm.tsx`
각 연락처 입력 필드(카톡 채널 링크 / 전화번호 / 인스타 계정) 아래에 라벨 입력 필드 추가.
- 라벨 필드의 placeholder에 `DEFAULT_CONTACT_LABELS`의 기본값을 표시해 "비우면 기본값"
  의도를 드러낸다.
- `Field` 컴포넌트에 `placeholder` prop을 추가하거나, 라벨 필드용으로 직접 `Input`을 쓴다.

### 5. 고객 화면 — `components/customer/ContactButtons.tsx`
하드코딩 라벨을 폴백 사용으로 교체:
```ts
label: settings.kakao_label ?? DEFAULT_CONTACT_LABELS.kakao
label: settings.phone_label ?? DEFAULT_CONTACT_LABELS.phone
label: settings.instagram_label ?? DEFAULT_CONTACT_LABELS.instagram
```

## 테스트

`components/customer/ContactButtons.test.tsx` (신규 또는 기존 확장):
- 커스텀 라벨이 설정된 경우 해당 텍스트가 렌더된다.
- 라벨이 `null`인 경우 기본값이 렌더된다.
- 연락처 값이 없는 버튼은 라벨과 무관하게 렌더되지 않는다.

## 영향 / 마이그레이션 노트

- 신규 컬럼은 nullable이라 기존 행(id=1)에 자동으로 `null`이 들어가고 기본값으로 폴백된다.
  데이터 백필 불필요.
- DB 마이그레이션은 Supabase에 별도 적용 필요(코드 변경만으로는 적용되지 않음).
