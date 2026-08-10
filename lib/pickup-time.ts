// 픽업 시간 슬롯: 10:00 ~ 22:00, 30분 간격 (양 끝 포함).

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let minutes = 10 * 60; minutes <= 22 * 60; minutes += 30) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }
  return slots;
}

export const PICKUP_TIME_SLOTS: readonly string[] = buildSlots();

export function isPickupTimeAllowed(value: string): boolean {
  return PICKUP_TIME_SLOTS.includes(value);
}
