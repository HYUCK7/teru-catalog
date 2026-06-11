import { describe, expect, it } from "vitest";
import { isPickupTimeAllowed, PICKUP_TIME_SLOTS } from "./pickup-time";

describe("PICKUP_TIME_SLOTS", () => {
  it("11:00 부터 18:30 까지 30분 간격 16개 (19:00 제외)", () => {
    expect(PICKUP_TIME_SLOTS[0]).toBe("11:00");
    expect(PICKUP_TIME_SLOTS.at(-1)).toBe("18:30");
    expect(PICKUP_TIME_SLOTS).toHaveLength(16);
    expect(PICKUP_TIME_SLOTS).toContain("11:30");
    expect(PICKUP_TIME_SLOTS).toContain("14:30");
    expect(PICKUP_TIME_SLOTS).not.toContain("19:00");
  });
});

describe("isPickupTimeAllowed", () => {
  it("슬롯에 있으면 허용", () => {
    expect(isPickupTimeAllowed("11:00")).toBe(true);
    expect(isPickupTimeAllowed("18:30")).toBe(true);
  });

  it("범위 밖이거나 간격이 안 맞으면 불가", () => {
    expect(isPickupTimeAllowed("10:30")).toBe(false);
    expect(isPickupTimeAllowed("19:00")).toBe(false);
    expect(isPickupTimeAllowed("12:15")).toBe(false);
    expect(isPickupTimeAllowed("")).toBe(false);
  });
});
