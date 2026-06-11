import type { OrderStatus } from "@/lib/supabase/types";

// 픽업 진행 순서대로
export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "confirmed", label: "주문확정" },
  { value: "pickup_waiting", label: "픽업대기" },
  { value: "picked_up", label: "픽업완료" },
];

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.some((status) => status.value === value);
}

export function orderStatusLabel(value: OrderStatus): string {
  return ORDER_STATUSES.find((status) => status.value === value)?.label ?? value;
}
