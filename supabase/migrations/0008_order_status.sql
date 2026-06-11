-- 주문 상태: 주문확정(confirmed) → 픽업대기(pickup_waiting) → 픽업완료(picked_up)

alter table orders
  add column if not exists status text not null default 'confirmed'
  check (status in ('confirmed', 'pickup_waiting', 'picked_up'));

-- 기존 is_done 백필 (완료 → 픽업완료, 그 외 → 주문확정)
update orders
  set status = case when is_done then 'picked_up' else 'confirmed' end;

alter table orders drop column if exists is_done;
