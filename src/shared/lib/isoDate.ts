/** Calendar dates as ISO text ("2026-10-30"). The arithmetic runs in UTC, so no time zone moves a day. */
const DAY_MS = 86_400_000

function toTime(day: string): number {
  return Date.parse(`${day}T00:00:00Z`)
}

export function addDays(day: string, days: number): string {
  return new Date(toTime(day) + days * DAY_MS).toISOString().slice(0, 10)
}

/** The same day `months` months away, or the month's last day: 31/03 minus one month is 28/02. */
export function addMonths(day: string, months: number): string {
  const [year, month, date] = day.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0))
  target.setUTCDate(Math.min(date, lastDay.getUTCDate()))
  return target.toISOString().slice(0, 10)
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
