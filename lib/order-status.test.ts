import { describe, expect, it } from "vitest";
import { isOrderStatus, ORDER_STATUSES, orderStatusLabel } from "./order-status";

describe("ORDER_STATUSES", () => {
  it("주문확정 → 픽업대기 → 픽업완료 순서", () => {
    expect(ORDER_STATUSES.map((s) => s.value)).toEqual([
      "confirmed",
      "pickup_waiting",
      "picked_up",
    ]);
  });
});

describe("isOrderStatus", () => {
  it("유효한 값만 true", () => {
    expect(isOrderStatus("confirmed")).toBe(true);
    expect(isOrderStatus("pickup_waiting")).toBe(true);
    expect(isOrderStatus("picked_up")).toBe(true);
    expect(isOrderStatus("done")).toBe(false);
    expect(isOrderStatus("")).toBe(false);
  });
});

describe("orderStatusLabel", () => {
  it("상태에 맞는 한글 라벨", () => {
    expect(orderStatusLabel("confirmed")).toBe("주문확정");
    expect(orderStatusLabel("picked_up")).toBe("픽업완료");
  });
});
