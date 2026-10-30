import type { HistoryPointDto, SecurityType } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { startOfWeek } from '@/shared/lib/isoDate'
import { dayOffset, priceHistory, type BarSecurity } from './bars'
import { atUtc, SESSION_CLOSE_HOUR_UTC } from './time'

/** What an index needs to know about a security to weigh it. */
export interface IndexCandidate extends BarSecurity {
  sector: string
  country: string
}

/** Securities in each index of the mockups; MCAP follows the whole equity market. */
const MEMBERSHIP: Record<string, (security: IndexCandidate) => boolean> = {
  'BVMAC-A': (security) => security.type === 'equity',
  'CMK-BANK': (security) => security.type === 'equity' && security.sector === 'Banking',
  'CMK-AGRI': (security) => security.type === 'equity' && security.sector === 'Agribusiness',
  'CMK-CM': (security) => security.type === 'equity' && security.country === 'CM',
  'CMK-GA': (security) => security.type === 'equity' && security.country === 'GA',
  'CMK-BOND': (security) => security.type === 'bond',
  MCAP: (security) => security.type === 'equity',
}

export interface IndexMember {
  security: BarSecurity
  /** Shares outstanding, or amount issued / 100 for a bond: weight per unit of price. */
  units: number
}

export function indexMembers(
  code: string,
  securities: Iterable<IndexCandidate>,
  unitsOf: (security: { id: string; type: SecurityType }) => number | undefined,
): IndexMember[] {
  const isMember = MEMBERSHIP[code]
  if (!isMember) return []
  return [...securities].flatMap((security) => {
    const units = isMember(security) ? unitsOf(security) : undefined
    return units ? [{ security, units }] : []
  })
}

interface IndexLevel {
  value: number
  previousClose: number
}

/**
 * Daily closes of a capitalization-weighted index, chain-linked from its members' closes:
 * r_t = Σ cap_i,t−1 × (P_i,t / P_i,t−1 − 1) / Σ cap_i,t−1. Scaled so that yesterday's close is the
 * index's previous close; today's session, once open, is its live value. The members' histories
 * and the index's thus move together, so a portfolio's beta against it means something.
 */
export function indexCloses(
  index: IndexLevel,
  members: readonly IndexMember[],
  from: string,
  to: string,
  now = Date.now(),
): { day: string; close: number }[] {
  const today = toMarketDay(now)
  if (members.length === 0) return []
  // Chained up to today whatever `to` is, so a given day always has the same level.
  const histories = members.map(
    ({ security }) =>
      new Map(
        priceHistory(security, dayOffset(from, -7), today, '1d', now).map((bar) => [
          toMarketDay(bar.time),
          bar.close,
        ]),
      ),
  )
  const days = [...histories[0].keys()]
  const levels = [1]
  for (let t = 1; t < days.length; t++) {
    let weight = 0
    let move = 0
    members.forEach(({ units }, i) => {
      const before = histories[i].get(days[t - 1])
      const after = histories[i].get(days[t])
      if (before === undefined || after === undefined) return
      weight += units * before
      move += units * (after - before)
    })
    levels.push(levels[t - 1] * (1 + (weight > 0 ? move / weight : 0)))
  }
  const lastPast = days.findLastIndex((day) => day < today)
  const scale = lastPast === -1 ? 0 : index.previousClose / levels[lastPast]
  return days.flatMap((day, t) => {
    if (day < from || day > to) return []
    const close = day === today ? index.value : Number((levels[t] * scale).toFixed(2))
    return [{ day, close }]
  })
}

/** GET /indices/{code}/history for daily and weekly bars, at the session close. */
export function indexHistoryPoints(
  closes: readonly { day: string; close: number }[],
  interval: '1d' | '1w',
): HistoryPointDto[] {
  const points = closes.map(({ day, close }) => ({
    time: atUtc(day, SESSION_CLOSE_HOUR_UTC),
    value: close,
  }))
  if (interval === '1d') return points
  // The last session of each week.
  return points.filter((point, index) => {
    const next = points[index + 1]
    return !next || startOfWeek(next.time.slice(0, 10)) !== startOfWeek(point.time.slice(0, 10))
  })
}
