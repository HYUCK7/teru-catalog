-- 주문 총 금액 스냅샷 (상품 가격 변경과 무관하게 주문 시점 금액 보존)
alter table orders
  add column if not exists total_amount int not null default 0;
