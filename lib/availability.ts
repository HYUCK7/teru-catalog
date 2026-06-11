import type { BlockedTime } from "./supabase/types";

// "YYYY-MM-DD" 를 로컬 자정 Date 로 파싱 (타임존 영향 없이 요일 계산).
function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// 정기 휴무 요일(0=일..6=토) 또는 특정 휴무일이면 휴무.
export function isDateClosed(
  value: string,
  closedWeekdays: number[],
  closedDates: string[],
): boolean {
  const date = parseDate(value);
  if (!date) return true; // 형식 오류는 안전하게 휴무 처리
  if (closedWeekdays.includes(date.getDay())) return true;
  return closedDates.includes(value);
}

export function blockedTimesByDate(
  rows: BlockedTime[],
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    (map[row.block_date] ??= []).push(row.block_time);
  }
  return map;
}

export function isTimeBlocked(
  date: string,
  time: string,
  rows: BlockedTime[],
): boolean {
  return rows.some(
    (row) => row.block_date === date && row.block_time === time,
  );
}
