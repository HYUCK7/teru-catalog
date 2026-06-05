# 쇼핑몰형 카탈로그 웹 — 설계 문서

- 작성일: 2026-06-05
- 상태: 승인됨 (구현 플랜 작성 전)

## 1. 개요

모바일 웹/웹에서 사용하는 **단일 가게/브랜드용 상품 카탈로그 사이트**.
- **결제·회원 시스템 없음.** 고객은 상품을 둘러보기만 하고, 구매 전환은 외부 연락(카톡/전화/인스타)으로 유도.
- **관리자가 사이트 콘텐츠를 직접 운영.** 로고·대표 배너·가게 정보·카테고리·상품·사진을 관리자 페이지에서 등록·수정하면 고객 화면에 즉시 반영.

### 목표
- 가게 운영자가 개발자 도움 없이 상품/사진/가게정보를 관리할 수 있다.
- 고객은 모바일에서 빠르게 메인 → 메뉴 → 상품 상세를 둘러보고 문의할 수 있다.

### 비목표 (YAGNI)
- 결제, 장바구니, 회원가입/로그인(고객), 주문 관리, 재고 수량 관리
- 멀티테넌트(여러 가게), 다국어
- 회원가입 UI (관리자 계정은 수동 생성)

## 2. 기술 스택 (확정)

| 항목 | 결정 |
|------|------|
| 프론트엔드 | Next.js (App Router) + React + TypeScript |
| 스타일 | Tailwind CSS + shadcn/ui (모바일 우선) |
| 데이터 | Supabase (Postgres) |
| 서버 로직 | Next.js Server Action / Route Handler |
| 이미지 저장 | Supabase Storage |
| 인증 | Supabase Auth — 단일 관리자 계정 |
| 배포 | Vercel(프론트) + Supabase(클라우드) |

## 3. 화면 구성

### 고객 (모바일 우선)
1. **메인(랜딩)** `/`
   - 로고, 대표 배너, 가게 소개 문구, `메뉴 보기` 버튼
   - 상품을 직접 노출하지 않음 — 메뉴는 버튼을 눌러 진입
2. **메뉴** `/menu`
   - 상단 카테고리 탭(전체 + 각 카테고리) + 상품 그리드(2열)
   - 노출(is_visible) 상품만 표시
3. **상품 상세** `/products/[id]`
   - 사진 슬라이드(여러 장), 상품명, 가격, 설명
   - 하단 문의 CTA: **카톡 채널 링크 · 전화 · 인스타** (사이트 설정 값 사용)

### 관리자
1. **로그인** `/admin/login` — 이메일+비밀번호
2. **사이트 설정** `/admin/settings` — 로고, 대표 배너, 가게명, 소개 문구, 문의처(카톡 채널 링크/전화번호/인스타 계정)
3. **카테고리 관리** `/admin/categories` — 추가/수정/삭제/드래그 순서 변경
4. **상품 목록 + 등록/수정** `/admin/products`, `/admin/products/[id]`
   - 사진 여러 장 업로드, 상품명, 카테고리, 가격, 설명, 노출 on/off

## 4. 데이터 모델 (Postgres)

### site_settings (단일 행)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | int (고정 1) | 단일 행 강제 |
| shop_name | text | 가게명 |
| intro | text | 소개 문구 |
| logo_url | text | 로고 이미지 URL |
| banner_url | text | 대표 배너 이미지 URL |
| kakao_channel_url | text | 카톡 채널 링크 |
| phone | text | 전화번호 |
| instagram | text | 인스타 계정(핸들 또는 URL) |
| updated_at | timestamptz | |

### categories
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| name | text | 카테고리명 |
| sort_order | int | 정렬 순서 |
| created_at | timestamptz | |

### products
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| category_id | uuid (FK→categories) | |
| name | text | 상품명 |
| price | int | 가격(원) |
| description | text | 설명 |
| is_visible | boolean | 노출 여부 (기본 true) |
| sort_order | int | 정렬 순서 |
| created_at | timestamptz | |

### product_images
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| product_id | uuid (FK→products) | |
| image_url | text | 이미지 URL |
| sort_order | int | 표시 순서 |

> 카테고리 삭제 시 소속 상품 처리: 삭제 차단(상품 있으면 못 지움) 또는 미분류 이동 — 구현 플랜에서 결정. 기본안은 **삭제 차단**.

## 5. Storage

- 버킷 `public-assets`: 로고, 배너 (공개 읽기)
- 버킷 `products`: 상품 사진 (공개 읽기)
- 업로드는 관리자 인증 사용자만(Storage 정책)

## 6. 보안 / 인증

- **읽기(고객)**: 모든 테이블 + Storage 객체 공개 읽기.
  - 단, products는 공개 읽기 시 `is_visible = true`만 노출되도록 뷰 또는 쿼리에서 필터.
- **쓰기(관리자)**: Supabase RLS로 인증된 관리자만 INSERT/UPDATE/DELETE 허용.
- `/admin/*`는 Next.js 미들웨어에서 세션 검사 → 비로그인 시 `/admin/login` 리다이렉트.
- 관리자 계정은 Supabase 대시보드에서 1개 수동 생성. 회원가입 UI 없음.

## 7. 에러 처리

- 이미지 업로드: 형식(jpg/png/webp)·용량 제한 검증, 실패 시 사용자 메시지.
- 폼 검증: 필수값(상품명, 가격, 카테고리) 누락 방지.
- 없는 상품/카테고리 접근 시 404.
- 사이트 설정/이미지 미설정 시 고객 화면 기본 플레이스홀더 표시.

## 8. 테스트 전략

- 데이터 접근 로직 + Server Action 단위 테스트(카테고리/상품 CRUD, 설정 저장).
- 핵심 통합 흐름: 관리자 상품 등록 → 노출 on → 고객 메뉴/상세에 표시, 노출 off → 미표시.
- 인증 가드: 비로그인 `/admin/*` 접근 차단 확인.

## 9. 컴포넌트 경계 (요약)

- `lib/supabase` — 클라이언트/서버 Supabase 인스턴스, 타입
- `lib/data` — categories/products/settings 조회·변경 함수 (UI와 분리)
- `app/(customer)` — 메인/메뉴/상세 (읽기 전용)
- `app/admin` — 설정/카테고리/상품 (쓰기, 인증 필요)
- `components/ui` — shadcn 기반 공용 컴포넌트
