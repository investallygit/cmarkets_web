import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import { securities } from '../db'
import { holidayEvents } from '../fixtures/calendar'
import { atUtc, isWeekday } from '../lib/time'

/** Session days in Douala, and the securities the files name. */

const DOUALA_UTC_OFFSET_HOURS = 1

/** A time in Douala on a day, as an ISO timestamp. */
export function doualaTime(day: string, hhmm: string): string {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return atUtc(day, hours - DOUALA_UTC_OFFSET_HOURS, minutes)
}

/** A weekday without a holiday. */
export function isSessionDay(day: string): boolean {
  return isWeekday(day) && holidayEvents(day, day).length === 0
}

/** The session the Data admin works on: today, or the last session day before it. */
export function currentSession(now = Date.now()): string {
  let day = toMarketDay(now)
  while (!isSessionDay(day)) day = addDays(day, -1)
  return day
}

export function sessionsBefore(day: string, count: number): string[] {
  const days: string[] = []
  for (let candidate = day; days.length < count; candidate = addDays(candidate, -1)) {
    if (isSessionDay(candidate)) days.push(candidate)
  }
  return days
}

/** A security by its CMarket code (the id) or its display code. */
export function findSecurity(code: string) {
  const upper = code.trim().toUpperCase()
  return [...securities.values()].find(
    (security) =>
      security.id.toUpperCase() === upper ||
      security.code.toUpperCase() === upper ||
      security.aliases?.some((alias) => alias.toUpperCase() === upper),
  )
}
