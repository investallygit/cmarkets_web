import type { HistoryInterval, HistoryPointDto } from '@/shared/api/contracts'
import { createRandom, gaussian, hashString } from './random'
import { atUtc, businessDays, SESSION_CLOSE_HOUR_UTC, SESSION_OPEN_HOUR_UTC } from './time'

const VOLATILITY: Record<HistoryInterval, number> = {
  '5m': 0.0008,
  '30m': 0.002,
  '1d': 0.008,
  '1w': 0.018,
}
const DRIFT: Record<HistoryInterval, number> = { '5m': 0, '30m': 0, '1d': 0.0007, '1w': 0.003 }

/** Bar timestamps between two ISO dates for sessions that have started, never after `now`. */
function barTimes(from: string, to: string, interval: HistoryInterval, now: number): string[] {
  const sessions = businessDays(from, to).filter(
    (day) => Date.parse(atUtc(day, SESSION_OPEN_HOUR_UTC)) <= now,
  )
  if (interval === '1d') return sessions.map((day) => atUtc(day, SESSION_CLOSE_HOUR_UTC))
  if (interval === '1w') {
    return sessions
      .filter((_, index) => (sessions.length - 1 - index) % 5 === 0)
      .map((day) => atUtc(day, SESSION_CLOSE_HOUR_UTC))
  }
  const step = interval === '5m' ? 5 : 30
  const days = interval === '5m' ? sessions.slice(-1) : sessions.slice(-5)
  return days.flatMap((day) => {
    const times: string[] = []
    for (
      let minutes = SESSION_OPEN_HOUR_UTC * 60;
      minutes <= SESSION_CLOSE_HOUR_UTC * 60;
      minutes += step
    ) {
      const time = atUtc(day, Math.floor(minutes / 60), minutes % 60)
      if (Date.parse(time) <= now) times.push(time)
    }
    return times
  })
}

/** Seeded random walk that ends exactly at the current value. */
export function generateHistory(
  key: string,
  current: number,
  from: string,
  to: string,
  interval: HistoryInterval,
  now = Date.now(),
): HistoryPointDto[] {
  const times = barTimes(from, to, interval, now)
  const random = createRandom(hashString(`${key}|${interval}|${from}`))
  const values = new Array<number>(times.length)
  let value = current
  for (let index = times.length - 1; index >= 0; index--) {
    values[index] = value
    value = value / (1 + DRIFT[interval] + VOLATILITY[interval] * gaussian(random))
  }
  return times.map((time, index) => ({ time, value: Math.round(values[index] * 100) / 100 }))
}

/** 5 sessions x 4 points for the watchlist sparklines, ending at the current price. */
export function generateSparkline(key: string, current: number): number[] {
  const random = createRandom(hashString(`sparkline|${key}`))
  const points = [current]
  for (let index = 0; index < 19; index++)
    points.unshift(points[0] / (1 + 0.004 * gaussian(random)))
  return points
}
