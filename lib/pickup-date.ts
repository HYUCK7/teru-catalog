// 픽업 날짜 규칙: 당일·지난 날짜 불가(내일부터),
// 올해 말일(12/31)까지만 선택 가능.

export function getPickupDateRange(today: Date): { min: Date; max: Date } {
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  const min = new Date(year, month, today.getDate() + 1); // 내일 (월말이면 다음 달로 넘어감)
  const max = new Date(year, 11, 31); // 올해 12월 31일
  return { min, max };
}

export function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPickupDateAllowed(value: string, today: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const { min, max } = getPickupDateRange(today);
  return value >= formatDateValue(min) && value <= formatDateValue(max);
}
