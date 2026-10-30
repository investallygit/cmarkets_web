import {
  ACCOUNT_TYPES,
  type AccountType,
  type ChartDrawingDto,
  type LayoutItemDto,
  type MeDto,
  type NewsItemDto,
  type NotificationDto,
  type TradeDto,
} from '@/shared/api/contracts'
import {
  createCalendar,
  createNews,
  createNotifications,
  UPCOMING_ALERTS,
  UPCOMING_NEWS,
} from './fixtures/feeds'
import { INDEX_FIXTURES, type IndexFixture } from './fixtures/market'
import { SECURITY_FIXTURES, type SecurityFixture } from './fixtures/securities'
import { DEMO_USERS, ROLE_PERMISSIONS, ROLE_QUOTAS } from './fixtures/users'
import { generateSparkline } from './lib/history'
import { initialTrades } from './lib/trades'

/**
 * In-memory state of the fake back end. REST handlers and the simulated hub share it,
 * so a price pushed in real time is also what the next REST call returns.
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

const startedAt = Date.now()
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

/** Trades kept per security for GET /securities/{id}/trades. */
const MAX_TRADES = 50

export const indices = new Map<string, MockIndex>(
  INDEX_FIXTURES.map((index) => [
    index.code,
    { ...index, anchor: index.value, updatedAt: startedAtIso },
  ]),
)

export const news: NewsItemDto[] = createNews(startedAt)
export const notifications: NotificationDto[] = createNotifications(startedAt)
export const calendar = createCalendar(startedAt)

const upcomingNews = [...UPCOMING_NEWS]
const upcomingAlerts = [...UPCOMING_ALERTS]

export function changePct(last: number, previousClose: number): number {
  return previousClose === 0 ? 0 : ((last - previousClose) / previousClose) * 100
}

/** One trade: a small random move, pulled back toward the opening level, on the tick size. */
export function tickSecurity(id: string): MockSecurity | undefined {
  const security = securities.get(id)
  if (!security) return undefined
  const bond = security.type === 'bond'
  const tickSize = bond ? 0.01 : 5
  const noise = (Math.random() - 0.5) * (bond ? 0.0008 : 0.004)
  const pull = ((security.anchor - security.last) / security.anchor) * 0.15
  const next = Math.round((security.last * (1 + noise + pull)) / tickSize) * tickSize
  const quantity = Math.ceil(Math.random() * (bond ? 40 : 12))
  security.last = Number(Math.max(tickSize, next).toFixed(bond ? 2 : 0))
  security.high = Math.max(security.high, security.last)
  security.low = Math.min(security.low, security.last)
  security.volume += quantity
  security.updatedAt = new Date().toISOString()
  security.sparkline[security.sparkline.length - 1] = security.last
  security.trades.unshift({ time: security.updatedAt, price: security.last, quantity })
  security.trades.length = Math.min(security.trades.length, MAX_TRADES)
  return security
}

export function tickIndex(code: string): MockIndex | undefined {
  const index = indices.get(code)
  if (!index) return undefined
  const noise = (Math.random() - 0.5) * 0.0012
  const pull = ((index.anchor - index.value) / index.anchor) * 0.1
  index.value = Number((index.value * (1 + noise + pull)).toFixed(2))
  index.updatedAt = new Date().toISOString()
  return index
}

export function publishNextNews(): NewsItemDto | undefined {
  const content = upcomingNews.shift()
  if (!content) return undefined
  const item = {
    ...content,
    id: `news-live-${news.length + 1}`,
    publishedAt: new Date().toISOString(),
  }
  news.unshift(item)
  return item
}

export function triggerNextAlert(): NotificationDto | undefined {
  const content = upcomingAlerts.shift()
  if (!content) return undefined
  const number = notifications.length + 1
  const notification = {
    ...content,
    id: `notification-${number}`,
    alertId: `alert-${number}`,
    triggeredAt: new Date().toISOString(),
    read: false,
  }
  notifications.unshift(notification)
  return notification
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private browsing or storage disabled: the prototype just forgets on reload.
  }
}

const ACCOUNT_TYPE_KEY = 'cmarket.prototype.accountType'

/** Account type chosen in the user menu; Analyst by default, as in the screen 1 mockup. */
export function currentAccountType(): AccountType {
  const stored = readStorage(ACCOUNT_TYPE_KEY)
  return ACCOUNT_TYPES.find((accountType) => accountType === stored) ?? 'analyst'
}

export function setAccountType(accountType: AccountType): void {
  writeStorage(ACCOUNT_TYPE_KEY, accountType)
}

export function currentUser(): MeDto {
  const accountType = currentAccountType()
  return {
    ...DEMO_USERS[accountType],
    accountType,
    language: 'en',
    timeZone: 'Africa/Douala',
    permissions: ROLE_PERMISSIONS[accountType],
    quotas: ROLE_QUOTAS[accountType],
  }
}

function layoutKey(screen: string): string {
  return `cmarket.prototype.layout.${currentUser().id}.${screen}`
}

export function readLayout(screen: string): LayoutItemDto[] | undefined {
  const stored = readStorage(layoutKey(screen))
  if (!stored) return undefined
  try {
    return JSON.parse(stored) as LayoutItemDto[]
  } catch {
    return undefined
  }
}

export function writeLayout(screen: string, items: LayoutItemDto[]): void {
  writeStorage(layoutKey(screen), JSON.stringify(items))
}

function drawingsKey(securityId: string): string {
  return `cmarket.prototype.drawings.${currentUser().id}.${securityId}`
}

/** Chart drawings are saved per user (spec section 3). */
export function readDrawings(securityId: string): ChartDrawingDto[] {
  const stored = readStorage(drawingsKey(securityId))
  if (!stored) return []
  try {
    return JSON.parse(stored) as ChartDrawingDto[]
  } catch {
    return []
  }
}

export function writeDrawings(securityId: string, drawings: ChartDrawingDto[]): void {
  writeStorage(drawingsKey(securityId), JSON.stringify(drawings))
}
