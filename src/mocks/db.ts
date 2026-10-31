import {
  ACCOUNT_TYPES,
  MODULES,
  type AccessTokenDto,
  type AccountType,
  type AlertCondition,
  type AuditEntryDto,
  type ChartDrawingDto,
  type LayoutItemDto,
  type MeDto,
  type ModuleCode,
  type NewsItemDto,
  type NotificationDto,
  type PaymentMethod,
  type Permission,
  type PlatformSettingsDto,
  type PublicationRulesDto,
  type RolePermissionsDto,
  type SavedScreenDto,
  type TradeDto,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import type { RealtimeEventMap } from '@/shared/realtime'
import {
  createAccounts,
  INVITATION_FIXTURES,
  ORGANIZATION_FIXTURES,
  type StoredAccount,
  type StoredInvitation,
  type StoredOrganization,
} from './fixtures/accounts'
import {
  createAdminAudit,
  createSettings,
  REPORT_FIXTURES,
  type StoredReport,
} from './fixtures/admin'
import { createAlerts, type StoredAlert } from './fixtures/alerts'
import { createAuctions } from './fixtures/auctions'
import { createInvoices, createSubscriptions, PLANS } from './fixtures/billing'
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
import { ROLE_PERMISSIONS, WATCHLIST_FIXTURES, type WatchlistFixture } from './fixtures/users'
import {
  crossesThreshold,
  exceedsVolume,
  quoteAlertMessage,
  severityOf,
  type QuoteState,
} from './lib/alerts'
import { ACCESS_TOKEN_SECONDS, randomToken, REFRESH_TOKEN_MS } from './lib/auth'
import { priceHistory, sessionStarted } from './lib/bars'
import {
  isExpired,
  renewed,
  samePayer,
  type Payer,
  type StoredInvoice,
  type StoredSubscription,
} from './lib/billing'
import { generateSparkline } from './lib/history'
import { indexCloses, indexMembers } from './lib/indexHistory'
import type { MarketData, PortfolioBond, StoredPortfolio } from './lib/portfolioEngine'
import type { StoredAnalyst, StoredPublication } from './lib/research'
import type { ReaderContext } from './lib/researchViews'
import { businessDays } from './lib/time'
import { newId } from './lib/ids'
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

function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage disabled: nothing was kept.
  }
}

/**
 * Raised when the sample data changes: the browser's copy of the mock's data is dropped and
 * seeded again, which also ends the session of the prototype.
 */
const SEED_VERSION = '9'
const SEED_VERSION_KEY = 'cmarket.prototype.seedVersion'

function dropOutdatedSeeds(): void {
  try {
    const storage = window.localStorage
    if (storage.getItem(SEED_VERSION_KEY) === SEED_VERSION) return
    Object.keys(storage)
      .filter((key) => key.startsWith('cmarket.prototype.'))
      .forEach((key) => storage.removeItem(key))
    storage.setItem(SEED_VERSION_KEY, SEED_VERSION)
  } catch {
    // Storage disabled: there is no older copy.
  }
}

dropOutdatedSeeds()

let sessionUserId: string | null = null
/** A user is logged in, in this tab: a login or a refresh opens the session, a logout ends it. */
let sessionOpen = false

/** A login or a refresh: the user whose data the following requests are answered with. */
export function setSessionUser(userId: string | null): void {
  sessionUserId = userId
  sessionOpen = userId !== null
}

/** The user of the request being answered: the auth gate reads it from the access token. */
export function setRequestUser(userId: string): void {
  sessionUserId = userId
}

/**
 * A logout: nobody's alerts are watched until the next login. A request the auth gate already let
 * through is still answered for its user, though the logout ran while it waited for its latency.
 */
export function endSession(): void {
  sessionOpen = false
}

export function hasSession(): boolean {
  return sessionOpen
}

/** The account of the user logged in; the auth gate lets no request through without one. */
export function currentAccount(): StoredAccount {
  const account = sessionUserId ? findAccount(sessionUserId) : undefined
  if (!account) throw new Error('No session: the request did not go through the auth gate.')
  return account
}

export function currentAccountType(): AccountType {
  return currentAccount().accountType
}

export function currentUser(): MeDto {
  const account = currentAccount()
  const organization = organizationStore
    .read()
    .find((candidate) => candidate.id === account.organizationId)
  const subscription = subscriptionOf(account)
  const today = toMarketDay(Date.now())
  const { id, displayName, email, accountType, language, timeZone, phone } = account
  return {
    id,
    displayName,
    email,
    accountType,
    organization: organization ? { id: organization.id, name: organization.name } : null,
    language,
    timeZone,
    phone,
    twoFactorChannel: account.twoFactorChannel,
    permissions: permissionsOf(accountType),
    quotas: { ...settingsStore.read().quotas[accountType] },
    analystStatus: accountType === 'analyst' ? account.analystStatus : null,
    modules: modulesOf(account),
    trialEndsAt:
      subscription?.status === 'trial' && !isExpired(subscription, today)
        ? subscription.periodEnd
        : null,
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
  return storedArray(() => `cmarket.prototype.${name}.${currentAccount().id}`, initial)
}

/** Data every account sees, such as the research library. */
export function sharedStore<T extends object[]>(name: string, initial: () => T) {
  return storedArray(() => `cmarket.prototype.${name}`, initial)
}

/** One object every account sees, such as the platform settings. */
function sharedValue<T extends object>(name: string, initial: () => T) {
  const store = sharedStore<T[]>(name, () => [initial()])
  return {
    read: (): T => store.read()[0] ?? initial(),
    write: (value: T) => store.write([value]),
  }
}

/** Another user's data, read by an Admin; empty if that user never had any. */
export function userArray<T extends object>(name: string, userId: string): T[] {
  return parseArray<T[]>(readStorage(`cmarket.prototype.${name}.${userId}`)) ?? []
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

/** Quotas, research pricing and moderation, risk-free rate: what the Admin sets in ADMCFG. */
export const settingsStore = sharedValue<PlatformSettingsDto>('platformSettings', createSettings)

/** The role -> permission table of spec section 12, which the Admin edits. */
export const roleStore = sharedStore<RolePermissionsDto[]>('rolePermissions', () =>
  ACCOUNT_TYPES.map((role) => ({ role, permissions: [...ROLE_PERMISSIONS[role]] })),
)

export function permissionsOf(accountType: AccountType): Permission[] {
  return roleStore.read().find((entry) => entry.role === accountType)?.permissions ?? []
}

/** GET /publications/rules: the Admin's price range, commission and moderation mode. */
export function publicationRules(): PublicationRulesDto {
  const { minPrice, maxPrice, commissionPct, moderation } = settingsStore.read()
  return { currency: 'XAF', minPrice, maxPrice, commissionPct, moderation }
}

/**
 * Every action of a Data admin or an Admin, who, what, when, before and after (spec section 12),
 * newest last.
 */
export const auditStore = sharedStore<AuditEntryDto[]>('auditLog', createAdminAudit)

export type AuditActor = AuditEntryDto['actor']

export const actorOf = ({ id, displayName, accountType }: StoredAccount): AuditActor => ({
  id,
  displayName,
  accountType,
})

/** Writes an entry of the audit log, by the user of the request unless another is given. */
export function recordAudit(
  action: AuditEntryDto['action'],
  target: AuditEntryDto['target'],
  {
    changes = [],
    reason = null,
    at = new Date().toISOString(),
    actor,
  }: Partial<Pick<AuditEntryDto, 'changes' | 'reason' | 'at' | 'actor'>> = {},
): AuditEntryDto {
  const entry: AuditEntryDto = {
    id: newId('audit'),
    at,
    actor: actor ?? actorOf(currentAccount()),
    action,
    target,
    changes,
    reason,
  }
  auditStore.write([...auditStore.read(), entry])
  return entry
}

/** Accounts of every user: the demo users, their colleagues, and whoever signs up. */
export const accountStore = sharedStore<StoredAccount[]>('accounts', createAccounts)

export const organizationStore = sharedStore<StoredOrganization[]>('organizations', () =>
  ORGANIZATION_FIXTURES.map((organization) => ({ ...organization })),
)

export const invitationStore = sharedStore<StoredInvitation[]>('invitations', () =>
  INVITATION_FIXTURES.map((invitation) => ({ ...invitation })),
)

export function findAccount(id: string): StoredAccount | undefined {
  return accountStore.read().find((account) => account.id === id)
}

export function accountByEmail(email: string): StoredAccount | undefined {
  const address = email.trim().toLowerCase()
  return accountStore.read().find((account) => account.email.toLowerCase() === address)
}

/** Writes back an account changed in place. */
export function saveAccounts(): void {
  accountStore.write(accountStore.read())
}

/** A refresh token: 7 days, unless a logout or a new password revokes it first. */
export interface StoredSession {
  token: string
  userId: string
  createdAt: number
  expiresAt: number
  revoked: boolean
}

export const sessionStore = sharedStore<StoredSession[]>('sessions', () => [])

const REFRESH_COOKIE_KEY = 'cmarket.prototype.refreshCookie'

/**
 * The HttpOnly cookie that carries the refresh token. The browser keeps it and scripts cannot
 * read it; the mock plays the browser's part, so the client code never touches it either.
 */
export const refreshCookie = {
  read: () => readStorage(REFRESH_COOKIE_KEY),
  write: (token: string | null) =>
    token ? writeStorage(REFRESH_COOKIE_KEY, token) : removeStorage(REFRESH_COOKIE_KEY),
}

/** Access tokens of this tab's mock, by value; a reload starts again from the cookie. */
const accessTokens = new Map<string, { userId: string; expiresAt: number }>()

export function issueAccessToken(userId: string): AccessTokenDto {
  const accessToken = `mock-access.${randomToken()}`
  accessTokens.set(accessToken, { userId, expiresAt: Date.now() + ACCESS_TOKEN_SECONDS * 1000 })
  return { accessToken, tokenType: 'Bearer', expiresIn: ACCESS_TOKEN_SECONDS }
}

/** The user of a valid access token. */
export function userOfAccessToken(token: string): string | null {
  const entry = accessTokens.get(token)
  if (!entry || entry.expiresAt <= Date.now()) return null
  return findAccount(entry.userId)?.status === 'active' ? entry.userId : null
}

/** A new refresh token for the user, set as the cookie. */
export function openSession(userId: string): void {
  const now = Date.now()
  const token = randomToken(32)
  const sessions = sessionStore.read().filter((session) => session.expiresAt > now)
  sessions.push({
    token,
    userId,
    createdAt: now,
    expiresAt: now + REFRESH_TOKEN_MS,
    revoked: false,
  })
  sessionStore.write(sessions)
  refreshCookie.write(token)
}

/** The session of the cookie, if still valid. */
export function cookieSession(): StoredSession | undefined {
  const token = refreshCookie.read()
  return sessionStore
    .read()
    .find(
      (session) => session.token === token && !session.revoked && session.expiresAt > Date.now(),
    )
}

/** POST /auth/logout: the refresh token is revoked and the cookie deleted. */
export function closeSession(): void {
  const token = refreshCookie.read()
  const sessions = sessionStore.read()
  sessions.forEach((session) => {
    if (session.token === token) session.revoked = true
  })
  sessionStore.write(sessions)
  refreshCookie.write(null)
}

/** A new password logs out the user's sessions: the others, or all after a reset. */
export function revokeSessions(userId: string, { keepCurrent }: { keepCurrent: boolean }): void {
  const token = keepCurrent ? refreshCookie.read() : null
  const sessions = sessionStore.read()
  sessions.forEach((session) => {
    if (session.userId === userId && session.token !== token) session.revoked = true
  })
  sessionStore.write(sessions)
  for (const [value, entry] of accessTokens) {
    if (entry.userId === userId && !keepCurrent) accessTokens.delete(value)
  }
}

export const payerOf = (account: StoredAccount): Payer =>
  account.organizationId
    ? { type: 'organization', id: account.organizationId }
    : { type: 'user', id: account.id }

/** Users a plan covers: the account, or the organisation's members. */
export function seatsOf(payer: Payer): number {
  if (payer.type === 'user') return 1
  return accountStore.read().filter((account) => account.organizationId === payer.id).length
}

export const subscriptionStore = sharedStore<StoredSubscription[]>('subscriptions', () =>
  createSubscriptions(toMarketDay(startedAt)),
)

export const invoiceStore = sharedStore<StoredInvoice[]>('invoices', () =>
  createInvoices(toMarketDay(startedAt), subscriptionStore.read(), seatsOf),
)

/** The subscription that covers an account: its own, or its organisation's, renewed if due. */
export function subscriptionOf(account: StoredAccount): StoredSubscription | undefined {
  const payer = payerOf(account)
  const subscriptions = subscriptionStore.read()
  const index = subscriptions.findIndex((subscription) => samePayer(subscription.payer, payer))
  if (index < 0) return undefined
  const current = renewed(subscriptions[index], toMarketDay(Date.now()))
  if (current !== subscriptions[index]) {
    subscriptions[index] = current
    subscriptionStore.write(subscriptions)
  }
  return current
}

/** Modules of the plan or trial that covers an account; employees use every module. */
export function modulesOf(account: StoredAccount): ModuleCode[] {
  if (account.accountType === 'dataAdmin' || account.accountType === 'admin') return [...MODULES]
  const subscription = subscriptionOf(account)
  if (!subscription || isExpired(subscription, toMarketDay(Date.now()))) return []
  return PLANS.find((plan) => plan.id === subscription.planId)?.modules ?? []
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

/** EUR / XAF peg (spec section 14.2). */
const EUR_XAF = 655.957

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
    // Set by the Admin (spec section 14.3).
    riskFreeRatePct: settingsStore.read().riskFreeRatePct,
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
export const contentReportStore = sharedStore<StoredReport[]>('contentReports', () =>
  REPORT_FIXTURES.map((report) => ({ ...report })),
)

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
  // Between a logout and the next login, nobody's alerts are watched.
  if (!hasSession()) return []
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
  return `cmarket.prototype.layout.${currentAccount().id}.${screen}`
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
  return `cmarket.prototype.drawings.${currentAccount().id}.${securityId}`
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
