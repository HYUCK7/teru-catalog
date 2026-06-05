# shopmall - 상품 카탈로그 웹

## 로컬 실행

1. `nvm use 20.19.2`
2. `npm install`
3. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
4. Supabase에 `supabase/migrations/*.sql` 적용
5. Supabase Authentication에서 관리자 계정 1개 수동 생성
6. `npm run dev`

## 배포

- Vercel 프로젝트에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록
- Supabase Storage의 `public-assets`, `products` 버킷 공개 URL을 사용

## 구조

- 고객: `/`, `/menu`, `/products/[id]`
- 관리자: `/admin/login`, `/admin/settings`, `/admin/categories`, `/admin/products`
