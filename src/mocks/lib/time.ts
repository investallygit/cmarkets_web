import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'

export const MINUTE_MS = 60_000
export const DAY_MS = 86_400_000

/** Session hours of the mock in UTC (09:00 to 14:00 Douala). Placeholders, not BVMAC's real hours. */
export const SESSION_OPEN_HOUR_UTC = 8
export const SESSION_CLOSE_HOUR_UTC = 13

export function marketDay(offsetDays = 0, now = Date.now()): string {
  return toMarketDay(now + offsetDays * DAY_MS)
}

export function isWeekday(day: string): boolean {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay()
  return weekday !== 0 && weekday !== 6
}

/** The day `offset` weekdays away from today; at a weekend, today counts as the Friday before. */
export function businessDay(offset: number, now = Date.now()): string {
  let day = marketDay(0, now)
  while (!isWeekday(day)) day = addDays(day, -1)
  const step = Math.sign(offset)
  for (let remaining = Math.abs(offset); remaining > 0;) {
    day = addDays(day, step)
    if (isWeekday(day)) remaining -= 1
  }
  return day
}

/** Weekdays between two ISO dates, both included. */
export function businessDays(from: string, to: string): string[] {
  const days: string[] = []
  const end = Date.parse(`${to}T12:00:00Z`)
  for (let time = Date.parse(`${from}T12:00:00Z`); time <= end; time += DAY_MS) {
    const day = new Date(time).toISOString().slice(0, 10)
    if (isWeekday(day)) days.push(day)
  }
  return days
}

export function atUtc(day: string, hour: number, minute = 0): string {
  return `${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`
}
