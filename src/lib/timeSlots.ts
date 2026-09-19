const START_HOUR = 13; // 1:00 PM
const END_HOUR = 22; // 10:00 PM (last bookable slot)

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    if (hour !== END_HOUR) {
      slots.push(`${String(hour).padStart(2, "0")}:30`);
    }
  }
  return slots;
})();

export function formatTimeLabel(value: string): string {
  const [hourStr, minuteStr] = value.split(":");
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr} ${period}`;
}
