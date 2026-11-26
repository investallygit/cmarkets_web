import type { BeacRatePointDto } from '@/shared/api/contracts'

/** A step of the chart: its day as a time stamp, the three rates in force from it. */
export interface CorridorRow {
  time: number
  policy: number
  marginalLending: number
  deposit: number
}

const time = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`)

/**
 * The corridor's steps, drawn up to today: the last meeting's rates run on to it, so that the
 * steps reach the chart's right edge (screen 34).
 */
export function corridorRows(points: readonly BeacRatePointDto[], today: string): CorridorRow[] {
  const rows = points.map((point) => ({
    time: time(point.date),
    policy: point.policy,
    marginalLending: point.marginalLending,
    deposit: point.deposit,
  }))
  const last = rows.at(-1)
  if (last && time(today) > last.time) rows.push({ ...last, time: time(today) })
  return rows
}

/** The 1 January of each year from the first step to the last: the axis's ticks. */
export function yearTicks(rows: readonly CorridorRow[]): number[] {
  if (rows.length === 0) return []
  const first = new Date(rows[0].time).getUTCFullYear()
  const last = new Date(rows[rows.length - 1].time).getUTCFullYear()
  return Array.from({ length: last - first + 1 }, (_, index) =>
    Date.UTC(first + index, 0, 1),
  ).filter((tick) => tick >= rows[0].time)
}
