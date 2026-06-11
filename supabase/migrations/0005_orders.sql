-- 주문 (단일 상품, 픽업 전용)
create table orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity int not null default 1,
  customer_name text not null,
  phone text not null,
  pickup_date date not null,
  pickup_time text not null,
  lettering text not null default '',
  request_memo text not null default '',
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index on orders (created_at desc);

-- RLS: 공개 생성 / 관리자 조회·수정·삭제
alter table orders enable row level security;

create policy "public insert orders" on orders for insert
  to anon, authenticated with check (true);
create policy "admin read orders" on orders for select
  to authenticated using (true);
create policy "admin update orders" on orders for update
  to authenticated using (true) with check (true);
create policy "admin delete orders" on orders for delete
  to authenticated using (true);
