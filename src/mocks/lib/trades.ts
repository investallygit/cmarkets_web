import type { SecurityType, TradeDto } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { dayOffset, onTick, sessionStarted } from './bars'
import { createRandom, hashString } from './random'
import {
  atUtc,
  businessDays,
  MINUTE_MS,
  SESSION_CLOSE_HOUR_UTC,
  SESSION_OPEN_HOUR_UTC,
} from './time'

const STARTING_TRADES = 10

/** Latest session: today once it has opened, otherwise the last weekday before. */
function latestSession(now: number): string {
  const today = toMarketDay(now)
  if (sessionStarted(today, now)) return today
  return businessDays(dayOffset(today, -7), dayOffset(today, -1)).at(-1) ?? today
}

/** Trades of the latest session before the prototype starts, newest first, the last at `last`. */
export function initialTrades(
  security: { id: string; type: SecurityType; open: number; last: number },
  now: number,
): TradeDto[] {
  const random = createRandom(hashString(`trades|${security.id}`))
  const session = latestSession(now)
  const opened = Date.parse(atUtc(session, SESSION_OPEN_HOUR_UTC))
  const end = Math.min(now, Date.parse(atUtc(session, SESSION_CLOSE_HOUR_UTC)))
  const times = Array.from(
    { length: STARTING_TRADES },
    () => opened + random() * Math.max(MINUTE_MS, end - opened),
  ).sort((a, b) => b - a)
  return times.map((time, index) => {
    // Newest first: from the last price back to the open.
    const progress = index / (STARTING_TRADES - 1)
    const drift = (random() - 0.5) * 0.004 * security.last
    const price =
      index === 0
        ? security.last
        : security.last + (security.open - security.last) * progress + drift
    const quantity =
      security.type === 'bond' ? 50 + Math.round(random() * 350) : 1 + Math.round(random() * 29)
    return { time: new Date(time).toISOString(), price: onTick(price, security.type), quantity }
  })
}
