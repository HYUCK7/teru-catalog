"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { formatDateValue, getPickupDateRange } from "@/lib/pickup-date";
import { PICKUP_TIME_SLOTS } from "@/lib/pickup-time";

// "YYYY-MM-DD" → 로컬 Date (캘린더 disabled 매처용)
function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function PickupScheduler({
  closedWeekdays,
  closedDates,
  blockedByDate,
  dateError,
  timeError,
}: {
  closedWeekdays: number[];
  closedDates: string[];
  blockedByDate: Record<string, string[]>;
  dateError?: string;
  timeError?: string;
}) {
  const [today] = useState(() => new Date());
  const { min, max } = getPickupDateRange(today);
  const noneSelectable = min > max; // 12월엔 올해 안에 선택 가능한 날이 없음

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>(
    PICKUP_TIME_SLOTS[0],
  );

  const selectedDateValue = selectedDate ? formatDateValue(selectedDate) : "";
  const blockedTimes = selectedDateValue
    ? (blockedByDate[selectedDateValue] ?? [])
    : [];

  function onSelectDate(date: Date | undefined) {
    setSelectedDate(date);
    // 새 날짜에서 막힌 시간이면 예약 가능한 첫 시간으로 옮김
    const value = date ? formatDateValue(date) : "";
    const blocked = value ? (blockedByDate[value] ?? []) : [];
    if (blocked.includes(selectedTime)) {
      setSelectedTime(
        PICKUP_TIME_SLOTS.find((s) => !blocked.includes(s)) ?? "",
      );
    }
  }

  return (
    <div className="space-y-5">
      <input type="hidden" name="pickup_date" value={selectedDateValue} />
      <input type="hidden" name="pickup_time" value={selectedTime} />

      <div>
        <Label>픽업 날짜</Label>
        {noneSelectable ? (
          <p className="mt-1 text-sm text-gray-600">
            현재 선택 가능한 픽업 날짜가 없습니다. 가게에 문의해 주세요.
          </p>
        ) : (
          <div className="mt-1 flex justify-center">
            <div className="rounded border p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onSelectDate}
                startMonth={min}
                endMonth={max}
                defaultMonth={min}
                disabled={[
                  { before: min },
                  { after: max },
                  { dayOfWeek: closedWeekdays },
                  ...closedDates.map(parseLocalDate),
                ]}
              />
            </div>
          </div>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {selectedDateValue
            ? `선택: ${selectedDateValue}`
            : "내일부터 올해 말일까지, 영업일만 선택할 수 있어요."}
        </p>
        {dateError && <p className="text-sm text-red-600">{dateError}</p>}
      </div>

      <div>
        <Label htmlFor="pickup_time_select">픽업 시간</Label>
        {!selectedDateValue ? (
          <p className="mt-1 text-sm text-gray-500">
            먼저 픽업 날짜를 선택해 주세요.
          </p>
        ) : (
          <select
            id="pickup_time_select"
            value={selectedTime}
            onChange={(event) => setSelectedTime(event.target.value)}
            className="mt-1 block w-full rounded border p-2"
          >
            {!selectedTime && (
              <option value="" disabled>
                예약 가능한 시간이 없어요
              </option>
            )}
            {PICKUP_TIME_SLOTS.map((slot) => {
              const blocked = blockedTimes.includes(slot);
              return (
                <option key={slot} value={slot} disabled={blocked}>
                  {blocked ? `${slot} (예약 불가)` : slot}
                </option>
              );
            })}
          </select>
        )}
        {timeError && <p className="mt-1 text-sm text-red-600">{timeError}</p>}
      </div>
    </div>
  );
}
