import { describe, expect, it } from "vitest";
import {
  formatDateValue,
  getPickupDateRange,
  isPickupDateAllowed,
} from "./pickup-date";

// 기준일: 2026-06-10 (이번달=6월, 올해=2026)
const today = new Date(2026, 5, 10);

describe("formatDateValue", () => {
  it("로컬 기준 YYYY-MM-DD 로 포맷한다", () => {
    expect(formatDateValue(new Date(2026, 6, 1))).toBe("2026-07-01");
    expect(formatDateValue(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("getPickupDateRange", () => {
  it("min 은 내일, max 는 올해 12월 31일", () => {
    const { min, max } = getPickupDateRange(today);
    expect(formatDateValue(min)).toBe("2026-06-11");
    expect(formatDateValue(max)).toBe("2026-12-31");
  });

  it("월말이면 min 이 다음 달 1일로 넘어간다", () => {
    const { min } = getPickupDateRange(new Date(2026, 5, 30));
    expect(formatDateValue(min)).toBe("2026-07-01");
  });
});

describe("isPickupDateAllowed", () => {
  it("내일은 허용", () => {
    expect(isPickupDateAllowed("2026-06-11", today)).toBe(true);
  });

  it("이번 달 이후 날짜도 허용", () => {
    expect(isPickupDateAllowed("2026-06-30", today)).toBe(true);
  });

  it("올해 마지막 날은 허용", () => {
    expect(isPickupDateAllowed("2026-12-31", today)).toBe(true);
  });

  it("당일은 불가", () => {
    expect(isPickupDateAllowed("2026-06-10", today)).toBe(false);
  });

  it("지난 날짜는 불가", () => {
    expect(isPickupDateAllowed("2026-06-09", today)).toBe(false);
    expect(isPickupDateAllowed("2026-05-31", today)).toBe(false);
  });

  it("내년은 불가", () => {
    expect(isPickupDateAllowed("2027-01-01", today)).toBe(false);
  });

  it("형식이 잘못되면 불가", () => {
    expect(isPickupDateAllowed("", today)).toBe(false);
    expect(isPickupDateAllowed("2026/07/01", today)).toBe(false);
  });
});
