"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/actions/orders";
import { ORDER_STATUSES } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Filter = OrderStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  ...ORDER_STATUSES,
];

export function OrderList({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  const visible =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2 px-4 pb-2">
        {FILTERS.map((tab) => {
          const count =
            tab.value === "all" ? orders.length : (counts[tab.value] ?? 0);
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                active
                  ? "border-black bg-black text-white"
                  : "border-border text-gray-600 hover:bg-gray-100",
              )}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="p-4 text-gray-500">
          {orders.length === 0
            ? "주문이 없습니다."
            : "해당 상태의 주문이 없습니다."}
        </p>
      ) : (
        <ul className="space-y-3 p-4 pt-2">
          {visible.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderItem({ order }: { order: Order }) {
  const selectedChoices = order.selected_choices ?? [];
  const extraPrice = selectedChoices.reduce(
    (total, choice) => total + choice.price,
    0,
  );

  return (
    <li
      className={cn(
        "rounded border p-4",
        order.status === "picked_up" && "opacity-50",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 text-sm">
          {order.design_image_url && (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.design_image_url}
                alt="선택 디자인"
                className="h-24 w-24 rounded border object-cover"
              />
              <p className="mt-1 text-xs text-gray-500">선택 디자인</p>
            </div>
          )}
          <p className="font-bold">
            {order.product_name} × {order.quantity}
          </p>
          <p>
            주문자: {order.customer_name} ({order.phone})
          </p>
          <p>
            픽업: {order.pickup_date} {order.pickup_time}
          </p>
          {selectedChoices.length > 0 && (
            <div>
              <p>선택 항목:</p>
              <ul className="mt-1 space-y-0.5">
                {selectedChoices.map((choice, index) => (
                  <li key={`${choice.kind}-${choice.label}-${index}`}>
                    {choice.kind === "flavor" ? "맛" : "옵션"}: {choice.label}
                    {choice.price > 0
                      ? ` (+${choice.price.toLocaleString()}원)`
                      : ""}
                  </li>
                ))}
              </ul>
              {extraPrice > 0 && (
                <p className="text-gray-600">
                  추가 금액: {extraPrice.toLocaleString()}원
                </p>
              )}
            </div>
          )}
          {order.lettering && <p>레터링: {order.lettering}</p>}
          {order.request_memo && <p>요청: {order.request_memo}</p>}
          <p className="text-gray-400">
            {new Date(order.created_at).toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 self-start rounded-lg border p-1">
          {ORDER_STATUSES.map((status) => {
            const active = order.status === status.value;
            return (
              <button
                key={status.value}
                type="button"
                aria-pressed={active}
                disabled={active}
                onClick={() => updateOrderStatus(order.id, status.value)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  active
                    ? "bg-black text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
                )}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}
