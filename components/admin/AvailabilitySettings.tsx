"use client";

import { useState } from "react";
import {
  addBlockedTimesAction,
  addClosedDateAction,
  removeBlockedTimeAction,
  removeClosedDateAction,
  saveClosedWeekdays,
} from "@/actions/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blockedTimesByDate } from "@/lib/availability";
import { PICKUP_TIME_SLOTS } from "@/lib/pickup-time";
import type { BlockedTime } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function AvailabilitySettings({
  closedWeekdays,
  closedDates,
  blockedTimes,
}: {
  closedWeekdays: number[];
  closedDates: string[];
  blockedTimes: BlockedTime[];
}) {
  const [weekdays, setWeekdays] = useState<number[]>(closedWeekdays);
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<"day" | "times">("day");
  const [times, setTimes] = useState<string[]>([]);

  const blockedByDate = blockedTimesByDate(blockedTimes);
  const idByDateTime = new Map(
    blockedTimes.map((row) => [`${row.block_date} ${row.block_time}`, row.id]),
  );

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function toggleTime(slot: string) {
    setTimes((prev) =>
      prev.includes(slot) ? prev.filter((t) => t !== slot) : [...prev, slot],
    );
  }

  async function addDate() {
    if (!date) return;
    if (mode === "day") {
      await addClosedDateAction(date);
    } else {
      await addBlockedTimesAction(date, times);
    }
    setDate("");
    setTimes([]);
    setMode("day");
  }

  return (
    <section className="space-y-6 rounded border p-4">
      <h2 className="text-lg font-bold">예약 가능 설정</h2>

      {/* 정기 휴무 요일 */}
      <div>
        <Label>정기 휴무 요일</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, day) => {
            const active = weekdays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                onClick={() => toggleWeekday(day)}
                className={cn(
                  "h-9 w-9 rounded-full border text-sm font-medium",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          size="sm"
          className="mt-2"
          onClick={() => saveClosedWeekdays(weekdays)}
        >
          요일 저장
        </Button>
      </div>

      {/* 특정 날짜 휴무 / 시간 제외 추가 */}
      <div className="space-y-3 border-t pt-4">
        <Label>특정 날짜 관리</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="block_mode"
              checked={mode === "day"}
              onChange={() => setMode("day")}
            />
            하루 종일 휴무
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="block_mode"
              checked={mode === "times"}
              onChange={() => setMode("times")}
            />
            특정 시간만 제외
          </label>
        </div>

        {mode === "times" && (
          <div className="grid grid-cols-4 gap-2">
            {PICKUP_TIME_SLOTS.map((slot) => {
              const active = times.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTime(slot)}
                  className={cn(
                    "rounded-lg border py-1.5 text-sm",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        )}

        <Button
          type="button"
          size="sm"
          disabled={!date || (mode === "times" && times.length === 0)}
          onClick={addDate}
        >
          추가
        </Button>
      </div>

      {/* 등록된 휴무일 */}
      <div className="border-t pt-4">
        <Label>휴무일</Label>
        {closedDates.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">등록된 휴무일이 없습니다.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {closedDates.map((d) => (
              <li key={d} className="flex items-center gap-2 text-sm">
                <span>{d}</span>
                <button
                  type="button"
                  onClick={() => removeClosedDateAction(d)}
                  className="text-red-600 hover:underline"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 등록된 제외 시간 */}
      <div className="border-t pt-4">
        <Label>날짜별 제외 시간</Label>
        {Object.keys(blockedByDate).length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">
            등록된 제외 시간이 없습니다.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {Object.entries(blockedByDate).map(([d, slots]) => (
              <li key={d} className="text-sm">
                <span className="font-medium">{d}</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        const id = idByDateTime.get(`${d} ${slot}`);
                        if (id) removeBlockedTimeAction(id);
                      }}
                      className="rounded border px-2 py-0.5 text-red-600 hover:bg-muted"
                    >
                      {slot} ✕
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
