import { describe, expect, it } from "vitest";
import { isPickupTimeAllowed, PICKUP_TIME_SLOTS } from "./pickup-time";

describe("PICKUP_TIME_SLOTS", () => {
  it("10:00 부터 22:00 까지 30분 간격 25개", () => {
    expect(PICKUP_TIME_SLOTS[0]).toBe("10:00");
    expect(PICKUP_TIME_SLOTS.at(-1)).toBe("22:00");
    expect(PICKUP_TIME_SLOTS).toHaveLength(25);
    expect(PICKUP_TIME_SLOTS).toContain("10:30");
    expect(PICKUP_TIME_SLOTS).toContain("19:00");
    expect(PICKUP_TIME_SLOTS).not.toContain("22:30");
  });
});

describe("isPickupTimeAllowed", () => {
  it("슬롯에 있으면 허용", () => {
    expect(isPickupTimeAllowed("10:00")).toBe(true);
    expect(isPickupTimeAllowed("22:00")).toBe(true);
  });

  it("범위 밖이거나 간격이 안 맞으면 불가", () => {
    expect(isPickupTimeAllowed("09:30")).toBe(false);
    expect(isPickupTimeAllowed("22:30")).toBe(false);
    expect(isPickupTimeAllowed("12:15")).toBe(false);
    expect(isPickupTimeAllowed("")).toBe(false);
  });
});
