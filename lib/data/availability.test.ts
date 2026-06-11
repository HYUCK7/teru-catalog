import { describe, expect, it, vi } from "vitest";
import { makeClient } from "@/test/mock-supabase";
import {
  addBlockedTimes,
  addClosedDate,
  getBlockedTimes,
  getClosedDates,
  updateClosedWeekdays,
} from "./availability";

describe("getClosedDates", () => {
  it("closed_date 문자열 배열을 반환한다", async () => {
    const client = makeClient({
      closed_dates: {
        data: [{ closed_date: "2026-07-06" }, { closed_date: "2026-07-10" }],
        error: null,
      },
    });
    const dates = await getClosedDates(client as never);
    expect(dates).toEqual(["2026-07-06", "2026-07-10"]);
  });

  it("에러 시 throw", async () => {
    const client = makeClient({
      closed_dates: { data: null, error: { message: "x" } },
    });
    await expect(getClosedDates(client as never)).rejects.toThrow("x");
  });
});

describe("getBlockedTimes", () => {
  it("blocked_times 행을 반환한다", async () => {
    const client = makeClient({
      blocked_times: {
        data: [{ id: "1", block_date: "2026-07-07", block_time: "13:00" }],
        error: null,
      },
    });
    const rows = await getBlockedTimes(client as never);
    expect(rows).toHaveLength(1);
    expect(rows[0].block_time).toBe("13:00");
  });
});

describe("addClosedDate", () => {
  it("closed_dates 에 upsert 한다", async () => {
    const upsert = vi.fn(() => Promise.resolve({ error: null }));
    const client = { from: vi.fn(() => ({ upsert })) };
    await addClosedDate(client as never, "2026-07-06");
    expect(upsert).toHaveBeenCalledWith({ closed_date: "2026-07-06" });
  });
});

describe("addBlockedTimes", () => {
  it("빈 배열이면 아무것도 안 한다", async () => {
    const from = vi.fn();
    await addBlockedTimes({ from } as never, "2026-07-07", []);
    expect(from).not.toHaveBeenCalled();
  });

  it("여러 시간을 upsert 한다", async () => {
    const upsert = vi.fn(() => Promise.resolve({ error: null }));
    const client = { from: vi.fn(() => ({ upsert })) };
    await addBlockedTimes(client as never, "2026-07-07", ["13:00", "13:30"]);
    expect(upsert).toHaveBeenCalledWith(
      [
        { block_date: "2026-07-07", block_time: "13:00" },
        { block_date: "2026-07-07", block_time: "13:30" },
      ],
      { onConflict: "block_date,block_time" },
    );
  });
});

describe("updateClosedWeekdays", () => {
  it("site_settings 의 closed_weekdays 를 업데이트한다", async () => {
    const eq = vi.fn(() => Promise.resolve({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const client = { from: vi.fn(() => ({ update })) };
    await updateClosedWeekdays(client as never, [0, 1]);
    expect(update).toHaveBeenCalledWith({ closed_weekdays: [0, 1] });
    expect(eq).toHaveBeenCalledWith("id", 1);
  });
});
