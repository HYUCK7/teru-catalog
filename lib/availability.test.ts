import { describe, expect, it } from "vitest";
import {
  blockedTimesByDate,
  isDateClosed,
  isTimeBlocked,
} from "./availability";
import type { BlockedTime } from "./supabase/types";

// 2026-07-06 은 월요일, 2026-07-07 은 화요일
const MON = "2026-07-06";
const TUE = "2026-07-07";

describe("isDateClosed", () => {
  it("정기 휴무 요일이면 휴무", () => {
    // 1 = 월요일
    expect(isDateClosed(MON, [1], [])).toBe(true);
    expect(isDateClosed(TUE, [1], [])).toBe(false);
  });

  it("특정 휴무 날짜면 휴무", () => {
    expect(isDateClosed(TUE, [], [TUE])).toBe(true);
    expect(isDateClosed(TUE, [], [MON])).toBe(false);
  });

  it("형식이 잘못되면 휴무로 간주(안전)", () => {
    expect(isDateClosed("", [], [])).toBe(true);
  });
});

describe("blockedTimesByDate", () => {
  it("날짜별 시간 배열로 그룹핑한다", () => {
    const rows: BlockedTime[] = [
      { id: "1", block_date: TUE, block_time: "13:00" },
      { id: "2", block_date: TUE, block_time: "13:30" },
      { id: "3", block_date: MON, block_time: "15:00" },
    ];
    const map = blockedTimesByDate(rows);
    expect(map[TUE]).toEqual(["13:00", "13:30"]);
    expect(map[MON]).toEqual(["15:00"]);
  });
});

describe("isTimeBlocked", () => {
  const rows: BlockedTime[] = [
    { id: "1", block_date: TUE, block_time: "13:00" },
  ];

  it("해당 날짜의 제외 시간이면 true", () => {
    expect(isTimeBlocked(TUE, "13:00", rows)).toBe(true);
  });

  it("다른 시간/다른 날짜면 false", () => {
    expect(isTimeBlocked(TUE, "14:00", rows)).toBe(false);
    expect(isTimeBlocked(MON, "13:00", rows)).toBe(false);
  });
});
