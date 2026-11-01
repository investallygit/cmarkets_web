import type { NewsItemDto, TradeDto } from '@/shared/api/contracts'
import { createAuctions } from '../fixtures/auctions'
import { BOND_FIXTURES } from '../fixtures/bonds'
import { createCalendar } from '../fixtures/calendar'
import { createNews } from '../fixtures/feeds'
import { INDEX_FIXTURES, type IndexFixture } from '../fixtures/market'
import { PROFILE_FIXTURES } from '../fixtures/profiles'
import { SECURITY_FIXTURES, type SecurityFixture } from '../fixtures/securities'
import { generateSparkline } from '../lib/history'
import { indexCloses, indexMembers } from '../lib/indexHistory'
import { initialTrades } from '../lib/trades'

/**
 * The market as the mock started it: securities and indices with their live state, news, BEAC
 * auctions and the calendar, and the daily closes of the indices.
 */

export interface MockSecurity extends SecurityFixture {
  sparkline: number[]
  /** Opening level that random ticks are pulled back to. */
  anchor: number
  updatedAt: string
  open: number
  high: number
  low: number
  /** Volume of an ordinary session, for the generated history. */
  typicalVolume: number
  /** Latest trades of the session, newest first; each tick is a trade. */
  trades: TradeDto[]
}

export interface MockIndex extends IndexFixture {
  anchor: number
  updatedAt: string
}

export const startedAt = Date.now()
const startedAtIso = new Date(startedAt).toISOString()

export const securities = new Map<string, MockSecurity>(
  SECURITY_FIXTURES.map((security) => {
    const open = security.open ?? security.previousClose
    const mock: MockSecurity = {
      ...security,
      sparkline: generateSparkline(security.id, security.last),
      anchor: security.last,
      updatedAt: startedAtIso,
      open,
      high: security.high ?? Math.max(open, security.last),
      low: security.low ?? Math.min(open, security.last),
      typicalVolume: security.volume,
      trades: initialTrades({ ...security, open }, startedAt),
    }
    return [security.id, mock]
  }),
)

export const indices = new Map<string, MockIndex>(
  INDEX_FIXTURES.map((index) => [
    index.code,
    { ...index, anchor: index.value, updatedAt: startedAtIso },
  ]),
)

export const news: NewsItemDto[] = createNews(startedAt)

export const auctions = createAuctions(startedAt)
export const calendar = createCalendar(startedAt, auctions)

export function changePct(last: number, previousClose: number): number {
  return previousClose === 0 ? 0 : ((last - previousClose) / previousClose) * 100
}

type StoredIndexCloses = (code: string) => ReadonlyMap<string, number> | undefined

let storedIndexCloses: StoredIndexCloses = () => undefined

/** Set once by the mock's import store: the closes of the indices files replace the computed ones. */
export function setStoredIndexCloses(lookup: StoredIndexCloses): void {
  storedIndexCloses = lookup
}

/**
 * Daily closes of an index, chained from its members' closes, or as an indices file gave them;
 * undefined for an index without members, whose history stays a random walk.
 */
export function indexDailyCloses(code: string, from: string, to: string, now = Date.now()) {
  const index = indices.get(code)
  const members = indexMembers(code, securities.values(), ({ id, type }) =>
    type === 'bond'
      ? (BOND_FIXTURES[id]?.amountIssued ?? 0) / 100
      : (PROFILE_FIXTURES[id]?.sharesOutstanding ?? undefined),
  )
  if (!index || members.length === 0) return undefined
  const closes = indexCloses(index, members, from, to, now)
  const stored = storedIndexCloses(code)
  return stored
    ? closes.map(({ day, close }) => ({ day, close: stored.get(day) ?? close }))
    : closes
}
