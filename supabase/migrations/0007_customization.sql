-- 상품 커스텀 주문: 카테고리별 맛/옵션 항목 + 상품 노출 토글 + 주문 선택 스냅샷

create table category_choices (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  kind text not null check (kind in ('flavor', 'option')),
  label text not null,
  price int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index on category_choices (category_id);

alter table products
  add column if not exists flavor_enabled boolean not null default false;

alter table products
  add column if not exists option_enabled boolean not null default false;

alter table orders
  add column if not exists selected_choices jsonb not null default '[]'::jsonb;

alter table category_choices enable row level security;

create policy "public read category_choices" on category_choices
  for select using (true);

create policy "admin write category_choices" on category_choices
  for all to authenticated using (true) with check (true);
