/** A point of a line: its day (ISO) and value. */
export interface SeriesPoint {
  day: string
  value: number
}

/** A row of the value chart: the index, and the series compared with it, on a day. */
export interface ChartRow {
  day: string
  value: number
  compared?: number
}

/** The day of a timestamp or a date, as the API writes them: "2026-10-30T13:00:00Z" → "2026-10-30". */
export const dayOf = (time: string): string => time.slice(0, 10)

/** A series rebased to 100 on its first point (spec section 9, screen 31: "base-100 view"). */
export function rebased(points: readonly SeriesPoint[]): SeriesPoint[] {
  const first = points.at(0)?.value
  return first
    ? points.map((point) => ({ day: point.day, value: (point.value / first) * 100 }))
    : []
}

/**
 * The index and the series compared with it on the index's days, both based 100 on the first day
 * they share (a comparison only means something from a common start); the compared series keeps
 * its last value over a day it has none. Without a comparison, the index as it is, or based 100.
 */
export function chartRows(
  index: readonly SeriesPoint[],
  compared: readonly SeriesPoint[] | null,
  base100: boolean,
): ChartRow[] {
  if (!compared) return base100 ? rebased(index) : index.map((point) => ({ ...point }))
  const byDay = new Map(compared.map((point) => [point.day, point.value]))
  const start = index.findIndex((point) => byDay.has(point.day))
  if (start < 0) return rebased(index)
  const from = index.slice(start)
  const indexBase = from[0]!.value
  const comparedBase = byDay.get(from[0]!.day)!
  let last = comparedBase
  return from.map((point) => {
    last = byDay.get(point.day) ?? last
    return {
      day: point.day,
      value: (point.value / indexBase) * 100,
      compared: (last / comparedBase) * 100,
    }
  })
}

/** A month's returns in a year's row: twelve cells, null for a month without one. */
export function monthGrid(
  months: readonly { year: number; month: number | null; returnPct: number }[],
): { year: number; months: (number | null)[] }[] {
  const years = [...new Set(months.map((month) => month.year))].sort((a, b) => b - a)
  return years.map((year) => ({
    year,
    months: Array.from(
      { length: 12 },
      (_, index) =>
        months.find((month) => month.year === year && month.month === index + 1)?.returnPct ?? null,
    ),
  }))
}
