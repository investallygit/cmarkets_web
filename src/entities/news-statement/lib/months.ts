import { addMonths } from '@/shared/lib/isoDate'

/** "2026-11-11" → "2026-11": the month of a day. */
export const monthOf = (day: string) => day.slice(0, 7)

/** The month before a day's: the statements' month the calculation day produced. */
export const previousMonth = (day: string) => monthOf(addMonths(`${monthOf(day)}-01`, -1))

/** A month moved by a number of months: ("2026-10", 1) → "2026-11". */
export const shiftMonth = (month: string, months: number) =>
  monthOf(addMonths(`${month}-01`, months))

/** The months of a selector, the latest first: from `last` back over `count` months. */
export const monthsUpTo = (last: string, count: number): string[] =>
  Array.from({ length: count }, (_, index) => shiftMonth(last, -index))

/** A month such as "2026-10". */
export const isMonth = (value: string | null): value is string =>
  value !== null && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
