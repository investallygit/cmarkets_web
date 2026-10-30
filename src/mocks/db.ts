import {
  ACCOUNT_TYPES,
  type AccountType,
  type AlertCondition,
  type ChartDrawingDto,
  type LayoutItemDto,
  type MeDto,
  type NewsItemDto,
  type NotificationDto,
  type PaymentMethod,
  type SavedScreenDto,
  type TradeDto,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import type { RealtimeEventMap } from '@/shared/realtime'
import { createAlerts, type StoredAlert } from './fixtures/alerts'
import { createAuctions } from './fixtures/auctions'
import { BOND_FIXTURES, cashFlows } from './fixtures/bonds'
import { createCalendar } from './fixtures/calendar'
import { createNews, createNotifications, UPCOMING_NEWS } from './fixtures/feeds'
import { INDEX_FIXTURES, type IndexFixture } from './fixtures/market'
import { createPortfolios } from './fixtures/portfolios'
import {
  ANALYST_FIXTURES,
  COUNTRY_NAMES,
  createLibrary,
  FOLLOW_FIXTURES,
  READ_FIXTURES,
  type ResearchMarket,
} from './fixtures/research'
import { PROFILE_FIXTURES } from './fixtures/profiles'
import { SAVED_SCREEN_FIXTURES } from './fixtures/screens'
import { SECURITY_FIXTURES, type SecurityFixture } from './fixtures/securities'
import {
  DEMO_USERS,
  ROLE_PERMISSIONS,
  ROLE_QUOTAS,
  WATCHLIST_FIXTURES,
  type WatchlistFixture,
} from './fixtures/users'
import {
  crossesThreshold,
  exceedsVolume,
  quoteAlertMessage,
  severityOf,
  type QuoteState,
} from './lib/alerts'
import { priceHistory, sessionStarted } from './lib/bars'
import { generateSparkline } from './lib/history'
import { indexCloses, indexMembers } from './lib/indexHistory'
import type { MarketData, PortfolioBond, StoredPortfolio } from './lib/portfolioEngine'
import type { StoredAnalyst, StoredPublication } from './lib/research'
import type { ReaderContext } from './lib/researchViews'
import { businessDays } from './lib/time'
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
export const auctions = createAuctions(startedAt)
export const calendar = createCalendar(startedAt, auctions)

const upcomingNews = [...UPCOMING_NEWS]

export function changePct(last: number, previousClose: number): number {
  return previousClose === 0 ? 0 : ((last - previousClose) / previousClose) * 100
}

function quoteState(security: MockSecurity): QuoteState {
  return {
    last: security.last,
    changePct: changePct(security.last, security.previousClose),
    volume: security.volume,
  }
}

/**
 * One trade: a small random move, pulled back toward the opening level, on the tick size.
 * Returns the notifications of the user's alerts that the trade set off.
 */
export function tickSecurity(
  id: string,
): { security: MockSecurity; alerts: NotificationDto[] } | undefined {
  const security = securities.get(id)
  if (!security) return undefined
  const before = quoteState(security)
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
  return { security, alerts: checkQuoteAlerts(security, before) }
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

/** Publishes the next sample news item, with the notifications of the alerts it sets off. */
export function publishNextNews(): { item: NewsItemDto; alerts: NotificationDto[] } | undefined {
  const next = upcomingNews.shift()
  if (!next) return undefined
  const { auctionResults = false, ...content } = next
  const item = {
    ...content,
    id: `news-live-${news.length + 1}`,
    publishedAt: new Date().toISOString(),
  }
  news.unshift(item)
  return { item, alerts: checkNewsAlerts(item, auctionResults) }
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
    analystStatus: accountType === 'analyst' ? 'approved' : null,
  }
}

/** An array kept in localStorage, so that the prototype remembers it on reload. */
function storedArray<T extends object[]>(keyOf: () => string, initial: () => T) {
  const cache = new Map<string, T>()
  return {
    read(): T {
      const key = keyOf()
      let value = cache.get(key)
      if (!value) {
        value = parseArray<T>(readStorage(key)) ?? initial()
        cache.set(key, value)
      }
      return value
    },
    write(value: T): void {
      const key = keyOf()
      cache.set(key, value)
      writeStorage(key, JSON.stringify(value))
    },
  }
}

/** Data of the current user. */
function userStore<T extends object[]>(name: string, initial: () => T) {
  return storedArray(() => `cmarket.prototype.${name}.${currentUser().id}`, initial)
}

/** Data every account sees, such as the research library. */
function sharedStore<T extends object[]>(name: string, initial: () => T) {
  return storedArray(() => `cmarket.prototype.${name}`, initial)
}

function parseArray<T extends object[]>(stored: string | null): T | undefined {
  if (!stored) return undefined
  try {
    const value: unknown = JSON.parse(stored)
    return Array.isArray(value) ? (value as T) : undefined
  } catch {
    return undefined
  }
}

export type StoredWatchlist = WatchlistFixture

export const watchlistStore = userStore<StoredWatchlist[]>('watchlists', () =>
  WATCHLIST_FIXTURES.map((list) => ({
    ...list,
    columns: [...list.columns],
    securityIds: [...list.securityIds],
  })),
)

export const alertStore = userStore<StoredAlert[]>('alerts', () => createAlerts(startedAt))

export const savedScreenStore = userStore<SavedScreenDto[]>('screens', () =>
  SAVED_SCREEN_FIXTURES.map((screen) => ({ ...screen, criteria: [...screen.criteria] })),
)

/**
 * Daily closes of an index, chained from its members' closes; undefined for an index without
 * members, whose history stays a random walk.
 */
export function indexDailyCloses(code: string, from: string, to: string, now = Date.now()) {
  const index = indices.get(code)
  const members = indexMembers(code, securities.values(), ({ id, type }) =>
    type === 'bond'
      ? (BOND_FIXTURES[id]?.amountIssued ?? 0) / 100
      : (PROFILE_FIXTURES[id]?.sharesOutstanding ?? undefined),
  )
  if (!index || members.length === 0) return undefined
  return indexCloses(index, members, from, to, now)
}

/** EUR / XAF peg (spec section 14.2). */
const EUR_XAF = 655.957
/** Admin setting of spec section 14.3; the screen 5 mockup shows 5.0%. */
const RISK_FREE_RATE_PCT = 5

/** The market data of the mock, as the portfolio service reads it. */
export function marketData(now = Date.now()): MarketData {
  const bonds = new Map<string, PortfolioBond | undefined>()
  const dailyBars = (id: string, from: string, to: string) => {
    const security = securities.get(id)
    return security ? priceHistory(security, from, to, '1d', now) : []
  }
  return {
    today: toMarketDay(now),
    security(id) {
      const security = securities.get(id)
      if (!security) return undefined
      const { code, name, type, sector, country, currency } = security
      const issuer = BOND_FIXTURES[id]?.issuer ?? PROFILE_FIXTURES[id]?.issuer ?? name
      return { id, code, name, type, sector, country, currency, issuer }
    },
    quote(id) {
      const security = securities.get(id)
      if (!security) return undefined
      return {
        last: security.last,
        previousClose: security.previousClose,
        tradedToday: security.volume > 0,
        isDelayed: currentAccountType() === 'student',
      }
    },
    closes: (id, from, to) =>
      new Map(dailyBars(id, from, to).map((bar) => [toMarketDay(bar.time), bar.close])),
    quietDays: (id, from, to) => dailyBars(id, from, to).filter((bar) => bar.volume === 0).length,
    bond(id) {
      if (!bonds.has(id)) {
        const terms = BOND_FIXTURES[id]
        bonds.set(id, terms && { ...terms, schedule: cashFlows(terms) })
      }
      return bonds.get(id)
    },
    dividends: (id) => PROFILE_FIXTURES[id]?.dividends ?? [],
    sessions: (from, to) => businessDays(from, to).filter((day) => sessionStarted(day, now)),
    index(code) {
      const index = indices.get(code)
      return index && { code, name: index.name }
    },
    indexCloses: (code, from, to) =>
      new Map((indexDailyCloses(code, from, to, now) ?? []).map(({ day, close }) => [day, close])),
    fx(from, to) {
      if (from === to) return 1
      if (from === 'EUR' && to === 'XAF') return EUR_XAF
      if (from === 'XAF' && to === 'EUR') return 1 / EUR_XAF
      return 1
    },
    riskFreeRatePct: RISK_FREE_RATE_PCT,
  }
}

/** Built from the price history the first time a user opens PORT, then kept like the rest. */
export const portfolioStore = userStore<StoredPortfolio[]>('portfolios', () =>
  createPortfolios(currentAccountType(), marketData()),
)

/** Prices of the research library: closes on a day, and the bars of a frozen chart. */
export function researchMarket(now = Date.now()): ResearchMarket {
  return {
    today: toMarketDay(now),
    security: (id) => securities.get(id),
    closeOn(id, day) {
      const security = securities.get(id)
      return security
        ? priceHistory(security, addDays(day, -10), day, '1d', now).at(-1)?.close
        : undefined
    },
    bars(id, from, to, interval) {
      const security = securities.get(id)
      return security ? priceHistory(security, from, to, interval, now) : []
    },
  }
}

/** Publications of every analyst, shared by all accounts. */
export const publicationStore = sharedStore<StoredPublication[]>('publications', () =>
  createLibrary(researchMarket()),
)

export const analystStore = sharedStore<StoredAnalyst[]>('analysts', () =>
  ANALYST_FIXTURES.map((analyst) => ({ ...analyst })),
)

export interface StoredPurchase {
  publicationId: string
  paymentId: string
  amount: number
  method: PaymentMethod
  purchasedAt: string
}

export const purchaseStore = userStore<StoredPurchase[]>('purchases', () => [])

export const followStore = userStore<{ analystId: string }[]>('follows', () =>
  FOLLOW_FIXTURES.map((analystId) => ({ analystId })),
)

/** The user's rating of a publication, and the month it counts in. */
export const myRatingStore = userStore<{ publicationId: string; stars: number; month: string }[]>(
  'ratings',
  () => [],
)

export const readStore = userStore<{ publicationId: string }[]>('reads', () =>
  READ_FIXTURES.map((publicationId) => ({ publicationId })),
)

/** Reports of readers, for the moderation queue of the Admin (screen 9). */
export const contentReportStore = sharedStore<
  { publicationId: string; userId: string; reason: string; comment: string; reportedAt: string }[]
>('contentReports', () => [])

/** The current user as the research library sees them: what they bought, read and rated. */
export function readerContext(now = Date.now()): ReaderContext {
  const user = currentUser()
  const analysts = analystStore.read()
  return {
    today: toMarketDay(now),
    user: {
      id: user.id,
      displayName: user.displayName,
      accountType: user.accountType,
      canBuy: user.permissions.includes('research:buy'),
    },
    security: (id) => securities.get(id),
    countryName: (code) => COUNTRY_NAMES[code],
    analyst: (id) => analysts.find((analyst) => analyst.id === id),
    purchases: new Map(purchaseStore.read().map((purchase) => [purchase.publicationId, purchase])),
    reads: new Set(readStore.read().map((read) => read.publicationId)),
    myRatings: new Map(myRatingStore.read().map((rating) => [rating.publicationId, rating.stars])),
  }
}

type PublicationEvent = RealtimeEventMap['PublicationPublished']
const publicationListeners = new Set<(event: PublicationEvent) => void>()

/** Publications and updates, for the simulated hub to push to followers. */
export function onPublicationPublished(listener: (event: PublicationEvent) => void): () => void {
  publicationListeners.add(listener)
  return () => publicationListeners.delete(listener)
}

export function announcePublication(event: PublicationEvent): void {
  publicationListeners.forEach((listener) => listener(event))
}

/** Records that an alert went off: a notification for the user and the time on the alert. */
function triggerAlert(alert: StoredAlert, subject: string, message: string): NotificationDto {
  const triggeredAt = new Date().toISOString()
  alert.lastTriggeredAt = triggeredAt
  const notification: NotificationDto = {
    id: `notification-${notifications.length + 1}`,
    alertId: alert.id,
    triggeredAt,
    subject,
    message,
    severity: severityOf(alert.condition),
    read: false,
  }
  notifications.unshift(notification)
  return notification
}

function triggerAll(
  match: (
    condition: AlertCondition,
    alert: StoredAlert,
  ) => [subject: string, message: string] | null,
): NotificationDto[] {
  const alerts = alertStore.read()
  const triggered = alerts.flatMap((alert) => {
    const found = alert.enabled ? match(alert.condition, alert) : null
    return found ? [triggerAlert(alert, ...found)] : []
  })
  if (triggered.length > 0) alertStore.write(alerts)
  return triggered
}

/**
 * Price and volume alerts go off when a trade crosses their threshold. The prototype lets each one
 * go off once a session, so a price hovering around the threshold does not repeat it.
 */
function checkQuoteAlerts(security: MockSecurity, before: QuoteState): NotificationDto[] {
  const after = quoteState(security)
  const today = toMarketDay(Date.now())
  return triggerAll((condition, alert) => {
    if (condition.type !== 'price' && condition.type !== 'volume') return null
    if (condition.securityId !== security.id) return null
    if (alert.lastTriggeredAt && toMarketDay(alert.lastTriggeredAt) === today) return null
    const crossed =
      condition.type === 'price'
        ? crossesThreshold(condition, before, after)
        : exceedsVolume(condition, before, after, security.typicalVolume)
    return crossed ? [security.code, quoteAlertMessage(condition, security)] : null
  })
}

const alertListeners = new Set<(notification: NotificationDto) => void>()

/** Alerts set off by a REST call rather than by a tick, for the simulated hub to push. */
export function onAlertTriggered(listener: (notification: NotificationDto) => void): () => void {
  alertListeners.add(listener)
  return () => alertListeners.delete(listener)
}

/** A portfolio limit newly breached sets off the portfolio alerts on it, or on all portfolios. */
export function triggerPortfolioAlerts(
  portfolioId: string,
  subject: string,
  message: string,
): NotificationDto[] {
  const triggered = triggerAll((condition) =>
    condition.type === 'portfolio' &&
    (condition.portfolioId === null || condition.portfolioId === portfolioId)
      ? [subject, message]
      : null,
  )
  triggered.forEach((notification) => alertListeners.forEach((listener) => listener(notification)))
  return triggered
}

/** Release alerts follow the issuer's news, auction alerts the BEAC results. */
function checkNewsAlerts(item: NewsItemDto, auctionResults: boolean): NotificationDto[] {
  return triggerAll((condition) => {
    if (
      condition.type === 'release' &&
      item.topic === 'issuer' &&
      item.securityIds.includes(condition.securityId)
    ) {
      return [item.source, `New release: ${item.headline}`]
    }
    if (
      condition.type === 'auction' &&
      auctionResults &&
      (condition.country === null || condition.country === item.country)
    ) {
      return [item.source, item.headline]
    }
    return null
  })
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
