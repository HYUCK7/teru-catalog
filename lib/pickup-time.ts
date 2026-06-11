// 픽업 시간 슬롯: 11:00 ~ 18:30, 30분 간격 (19:00 제외).

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let minutes = 11 * 60; minutes < 19 * 60; minutes += 30) {
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
