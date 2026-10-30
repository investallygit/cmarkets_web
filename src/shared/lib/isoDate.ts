/** Calendar dates as ISO text ("2026-10-30"). The arithmetic runs in UTC, so no time zone moves a day. */
const DAY_MS = 86_400_000

function toTime(day: string): number {
  return Date.parse(`${day}T00:00:00Z`)
}

export function addDays(day: string, days: number): string {
  return new Date(toTime(day) + days * DAY_MS).toISOString().slice(0, 10)
}

/** ISO weekday: 1 for Monday to 7 for Sunday. */
export function isoWeekday(day: string): number {
  return new Date(toTime(day)).getUTCDay() || 7
}

/** Monday of the week of `day`. */
export function startOfWeek(day: string): string {
  return addDays(day, 1 - isoWeekday(day))
}

export function isWeekend(day: string): boolean {
  return isoWeekday(day) >= 6
}

/** The days from `from` to `to`, both included. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = []
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day)
  return days
}
