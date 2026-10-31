import type { HistoryInterval, PriceBarDto, SecurityType } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { createRandom, gaussian, hashString } from './random'
import {
  atUtc,
  businessDays,
  DAY_MS,
  MINUTE_MS,
  SESSION_CLOSE_HOUR_UTC,
  SESSION_OPEN_HOUR_UTC,
} from './time'

/** What the bars need to know about a security; MockSecurity has it all. */
export interface BarSecurity {
  id: string
  type: SecurityType
  previousClose: number
  /** Today's session so far. */
  open: number
  high: number
  low: number
  last: number
  volume: number
  /** Volume of an ordinary session, for the past sessions. */
  typicalVolume: number
}

interface DailyBar extends PriceBarDto {
  day: string
}

/** Ten years of sessions, the longest chart period (spec section 3). */
const HISTORY_DAYS = 3660
const SESSION_MINUTES = (SESSION_CLOSE_HOUR_UTC - SESSION_OPEN_HOUR_UTC) * 60
const DAILY_VOLATILITY: Record<SecurityType, number> = { equity: 0.011, bond: 0.0012 }
const DAILY_DRIFT: Record<SecurityType, number> = { equity: 0.0003, bond: 0 }

/** Price step of a trade: 5 XAF for equities, 0.01 for bonds quoted per 100. */
export function tickSizeOf(type: SecurityType): number {
  return type === 'bond' ? 0.01 : 5
}

export function onTick(value: number, type: SecurityType): number {
  const tick = tickSizeOf(type)
  const rounded = Math.max(tick, Math.round(value / tick) * tick)
  return Number(rounded.toFixed(type === 'bond' ? 2 : 0))
}

export function dayOffset(day: string, days: number): string {
  return new Date(Date.parse(`${day}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

/** Whether a session has opened by `now`, so that day has a bar. */
export function sessionStarted(day: string, now: number): boolean {
  return businessDays(day, day).length === 1 && Date.parse(atUtc(day, SESSION_OPEN_HOUR_UTC)) <= now
}

/** A session as published from a file or corrected by the Data admin (screen 6). */
export type StoredSession = Pick<PriceBarDto, 'open' | 'high' | 'low' | 'close' | 'volume'>

type StoredSessions = (securityId: string) => ReadonlyMap<string, StoredSession> | undefined

let storedSessions: StoredSessions = () => undefined

/** Set once by the mock's import store: stored sessions replace the generated ones. */
export function setStoredSessions(lookup: StoredSessions): void {
  storedSessions = lookup
}

const withStored = (bar: DailyBar, session: StoredSession | undefined): DailyBar =>
  session ? { ...bar, ...session } : bar

const toBar = ({ time, open, high, low, close, volume }: DailyBar): PriceBarDto => ({
  time,
  open,
  high,
  low,
  close,
  volume,
})

const pastSessions = new Map<string, DailyBar[]>()

/** Sessions before today: a seeded random walk ending at the previous close, the same each call. */
function pastDailyBars(security: BarSecurity, today: string): DailyBar[] {
  const key = `${security.id}|${today}`
  const cached = pastSessions.get(key)
  if (cached) return cached
  const { type } = security
  const days = businessDays(dayOffset(today, -HISTORY_DAYS), dayOffset(today, -1))
  const random = createRandom(hashString(`daily|${security.id}`))
  const closes = new Array<number>(days.length)
  let close = security.previousClose
  for (let index = days.length - 1; index >= 0; index--) {
    closes[index] = close
    close /= 1 + DAILY_DRIFT[type] + DAILY_VOLATILITY[type] * gaussian(random)
  }
  const bars = days.map((day, index): DailyBar => {
    const barClose = onTick(closes[index], type)
    const open = onTick(index === 0 ? barClose : closes[index - 1], type)
    const range = Math.abs(gaussian(random)) * DAILY_VOLATILITY[type] * 0.6 * barClose
    return {
      day,
      time: atUtc(day, SESSION_OPEN_HOUR_UTC),
      open,
      high: onTick(Math.max(open, barClose) + range * random(), type),
      low: onTick(Math.min(open, barClose) - range * random(), type),
      close: barClose,
      volume: Math.round(security.typicalVolume * (0.3 + 1.4 * random())),
    }
  })
  pastSessions.set(key, bars)
  return bars
}

/** Every session up to now; today's bar comes from the live prices, unless a file gave it. */
function dailyBars(security: BarSecurity, now: number): DailyBar[] {
  const today = toMarketDay(now)
  const stored = storedSessions(security.id)
  const generated = pastDailyBars(security, today)
  const past = stored ? generated.map((bar) => withStored(bar, stored.get(bar.day))) : generated
  if (!sessionStarted(today, now)) return past
  const { open, high, low, last, volume } = security
  const time = atUtc(today, SESSION_OPEN_HOUR_UTC)
  return [
    ...past,
    withStored({ day: today, time, open, high, low, close: last, volume }, stored?.get(today)),
  ]
}

/** Monday of the week of a day. */
function weekOf(day: string): string {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay()
  return dayOffset(day, -((weekday + 6) % 7))
}

function weeklyBars(sessions: readonly DailyBar[]): PriceBarDto[] {
  const weeks = new Map<string, PriceBarDto>()
  for (const session of sessions) {
    const week = weeks.get(weekOf(session.day))
    if (!week) {
      weeks.set(weekOf(session.day), toBar(session))
      continue
    }
    week.high = Math.max(week.high, session.high)
    week.low = Math.min(week.low, session.low)
    week.close = session.close
    week.volume += session.volume
  }
  return [...weeks.values()]
}

/** A session's bars: a seeded path from its open to its close, up to now for today. */
function intradayBars(
  security: BarSecurity,
  session: DailyBar,
  step: number,
  now: number,
): PriceBarDto[] {
  const { type } = security
  const random = createRandom(hashString(`intraday|${security.id}|${session.day}|${step}`))
  const sessionOpen = Date.parse(atUtc(session.day, SESSION_OPEN_HOUR_UTC))
  const starts: number[] = []
  for (let minutes = 0; minutes < SESSION_MINUTES; minutes += step) {
    if (sessionOpen + minutes * MINUTE_MS <= now) starts.push(sessionOpen + minutes * MINUTE_MS)
  }
  // Random walk from the open, bent so that it ends exactly at the close.
  const count = starts.length
  const walk = [0]
  for (let index = 1; index <= count; index++) {
    walk.push(walk[index - 1] + gaussian(random) * DAILY_VOLATILITY[type] * 0.15 * session.open)
  }
  const path = walk.map(
    (value, index) =>
      session.open +
      ((session.close - session.open + walk[0] - walk[count]) * index) / count +
      value,
  )
  return starts.map((start, index) => {
    const open = onTick(path[index], type)
    const close = onTick(path[index + 1], type)
    const wiggle = Math.abs(gaussian(random)) * DAILY_VOLATILITY[type] * 0.05 * close
    return {
      time: new Date(start).toISOString(),
      open,
      high: onTick(Math.max(open, close) + wiggle, type),
      low: onTick(Math.min(open, close) - wiggle, type),
      close,
      volume: Math.round((session.volume / count) * (0.2 + 1.6 * random())),
    }
  })
}

/** GET /securities/{id}/history: the bars of the sessions between two ISO dates, both included. */
export function priceHistory(
  security: BarSecurity,
  from: string,
  to: string,
  interval: HistoryInterval,
  now = Date.now(),
): PriceBarDto[] {
  const sessions = dailyBars(security, now).filter((bar) => bar.day >= from && bar.day <= to)
  if (interval === '1d') return sessions.map(toBar)
  if (interval === '1w') return weeklyBars(sessions)
  // Intraday: the last session in 5-minute bars, the last five in 30-minute bars.
  const step = interval === '5m' ? 5 : 30
  return sessions
    .slice(interval === '5m' ? -1 : -5)
    .flatMap((session) => intradayBars(security, session, step, now))
}

/** Calendar days to load before `from` so that an indicator has values from the first bar. */
export function warmUpDays(interval: HistoryInterval, bars: number): number {
  if (interval === '1w') return Math.ceil(bars * 7 * 1.1)
  if (interval === '1d') return Math.ceil(bars * 1.5) + 7
  return 0
}
