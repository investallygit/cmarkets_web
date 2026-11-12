import { expect } from 'vitest'
import type { MeDto, ModuleCode, Paged, Permission } from '../../contracts'
import { adminApi } from '../admin'
import { alertsApi } from '../alerts'
import { analysisApi } from '../analysis'
import { bondsApi } from '../bonds'
import { chartsApi } from '../charts'
import { contentApi } from '../content'
import { dataAdminApi } from '../dataAdmin'
import { etfsApi } from '../etfs'
import { marketApi } from '../market'
import { meApi } from '../me'
import { messagingApi } from '../messaging'
import { networkApi } from '../network'
import { portfoliosApi } from '../portfolios'
import { researchApi } from '../research'
import { securitiesApi } from '../securities'
import { subscriptionsApi } from '../subscriptions'
import { watchlistsApi } from '../watchlists'

/** What the probes of an account need: who it is, and ids read from the API. */
export interface ProbeContext {
  me: MeDto
  equityId: string
  bondId: string
  etfId: string
}

/** One read of the API module, made when the account has what it needs. */
export interface Probe {
  name: string
  permission?: Permission
  module?: ModuleCode
  /** The answer may be a 404: no subscription, no organisation. */
  mayBeMissing?: boolean
  call: (context: ProbeContext) => Promise<unknown>
  /** The answer's shape, beyond "it came back without an error". */
  check?: (answer: never, context: ProbeContext) => void
}

const isList = (answer: unknown[]) => expect(Array.isArray(answer)).toBe(true)
const isPage = (answer: Paged<unknown>) => {
  expect(Array.isArray(answer.items)).toBe(true)
  expect(typeof answer.totalCount).toBe('number')
}
const has =
  (...keys: string[]) =>
  (answer: object) =>
    expect(Object.keys(answer)).toEqual(expect.arrayContaining(keys))

const year = { from: '2026-01-01', to: '2026-12-31', interval: '1d' }

/** The reads of every area, each with the permission and module the API asks for. */
export const PROBES: Probe[] = [
  {
    name: 'Me: /me',
    call: () => meApi.get(),
    check: (me: MeDto, context) => expect(me.email).toBe(context.me.email),
  },
  { name: 'Market: status', call: () => marketApi.status(), check: has('status') },
  {
    name: 'Market: summary',
    permission: 'market:read',
    call: () => marketApi.summary(),
    check: has('indices'),
  },
  {
    name: 'Market: movers',
    permission: 'market:read',
    call: () => marketApi.movers('gainers'),
    check: isList,
  },
  {
    name: 'Market: ticker',
    permission: 'market:read',
    call: () => marketApi.ticker(),
    check: isList,
  },
  {
    name: 'Market: indices',
    permission: 'market:read',
    call: () => marketApi.indices(),
    check: isList,
  },
  {
    name: 'Market: index history',
    permission: 'market:read',
    call: () => marketApi.indexHistory('BVMAC-A', year),
    check: isList,
  },
  {
    name: 'Market: policy rates',
    permission: 'market:read',
    call: () => marketApi.policyRates(),
    check: isList,
  },
  {
    name: 'Market: FX',
    permission: 'market:read',
    call: () => marketApi.fx(['EURXAF', 'USDXAF']),
    check: isList,
  },
  {
    name: 'Securities: search',
    call: () => securitiesApi.search('SEMC'),
    check: has('securities'),
  },
  {
    name: 'Securities: list',
    permission: 'market:read',
    call: () => securitiesApi.list({}),
    check: isList,
  },
  {
    name: 'Securities: profile',
    permission: 'market:read',
    call: (c) => securitiesApi.profile(c.equityId),
    check: has('isin', 'issuer'),
  },
  {
    name: 'Securities: quote',
    permission: 'market:read',
    call: (c) => securitiesApi.quote(c.equityId),
    check: has('last', 'changePct'),
  },
  {
    name: 'Securities: history',
    permission: 'market:read',
    call: (c) => securitiesApi.history(c.equityId, year),
    check: isList,
  },
  {
    name: 'Securities: order book',
    permission: 'market:orderbook',
    call: (c) => securitiesApi.orderBook(c.equityId),
    check: has('bids', 'asks'),
  },
  {
    name: 'Securities: trades',
    permission: 'market:orderbook',
    call: (c) => securitiesApi.trades(c.equityId),
    check: isList,
  },
  {
    name: 'Securities: dividends',
    permission: 'market:read',
    call: (c) => securitiesApi.dividends(c.equityId),
    check: isList,
  },
  {
    name: 'Securities: shareholders',
    permission: 'market:read',
    call: (c) => securitiesApi.shareholders(c.equityId),
  },
  {
    name: 'Watchlists: list',
    permission: 'market:read',
    call: () => watchlistsApi.list(),
    check: isList,
  },
  {
    name: 'Charts: drawings',
    permission: 'market:read',
    call: (c) => chartsApi.drawings(c.equityId),
    check: has('drawings'),
  },
  {
    name: 'Analysis: indicator',
    permission: 'analysis:read',
    call: (c) => analysisApi.indicator(c.equityId, { type: 'SMA', period: 20 }, year),
  },
  {
    name: 'Analysis: ratios',
    permission: 'analysis:read',
    module: 'analysis',
    call: (c) => analysisApi.ratios(c.equityId),
  },
  {
    name: 'Analysis: financials',
    permission: 'analysis:read',
    module: 'analysis',
    call: (c) => analysisApi.financials(c.equityId, { statement: 'income', years: 5 }),
  },
  {
    name: 'Analysis: compare',
    permission: 'analysis:read',
    module: 'analysis',
    call: (c) => analysisApi.compare([c.equityId]),
    check: isList,
  },
  {
    name: 'Analysis: screener',
    permission: 'analysis:read',
    module: 'analysis',
    call: () => analysisApi.screener({ criteria: [] }),
    check: has('universe', 'items'),
  },
  {
    name: 'Analysis: saved screens',
    permission: 'analysis:read',
    module: 'analysis',
    call: () => analysisApi.screens(),
    check: isList,
  },
  { name: 'Bonds: list', permission: 'market:read', call: () => bondsApi.list(), check: isList },
  {
    name: 'Bonds: bond',
    permission: 'market:read',
    call: (c) => bondsApi.bond(c.bondId),
    check: has('schedule', 'issuerCategory', 'calls', 'puts'),
  },
  // The bond profile (screen 20) reads on the market's permission, as every profile.
  {
    name: 'Bonds: analytics',
    permission: 'market:read',
    call: (c) => bondsApi.analytics(c.bondId),
    check: has('identification', 'pricing', 'risk', 'structure'),
  },
  {
    name: 'Bonds: analytics history',
    permission: 'market:read',
    call: (c) => bondsApi.analyticsHistory(c.bondId, {}),
    check: isList,
  },
  {
    name: 'Bonds: ratings',
    permission: 'market:read',
    call: (c) => bondsApi.ratings(c.bondId),
    check: has('agencies', 'composite', 'bucket', 'history'),
  },
  {
    name: 'Bonds: cash flows',
    permission: 'market:read',
    call: (c) => bondsApi.cashFlows(c.bondId),
    check: has('nextCouponDate', 'daysToNextCoupon', 'items'),
  },
  // ETFS (screen 15) on the screener's permissions; an ETF's reads on the market's, as its profile.
  {
    name: 'ETFs: screener',
    permission: 'analysis:read',
    module: 'analysis',
    call: () => etfsApi.screener({ pageSize: 200 }),
    check: has('universe', 'total', 'items'),
  },
  {
    name: 'ETFs: facets',
    permission: 'analysis:read',
    module: 'analysis',
    call: () => etfsApi.facets(),
    check: has('assetClasses', 'geographies', 'providers', 'exchanges'),
  },
  {
    name: 'ETFs: etf',
    permission: 'market:read',
    call: (c) => etfsApi.etf(c.etfId),
    check: has('identification', 'structure', 'size', 'costs'),
  },
  {
    name: 'ETFs: performance',
    permission: 'market:read',
    call: (c) => etfsApi.performance(c.etfId, ['1D', 'YTD', '1Y']),
    check: has('returns', 'trackingErrorPct', 'volatility1yPct', 'sharpe', 'maxDrawdownPct'),
  },
  {
    name: 'ETFs: distributions',
    permission: 'market:read',
    call: (c) => etfsApi.distributions(c.etfId),
    check: has('distribution', 'frequency', 'items'),
  },
  {
    name: 'Analysis: saved ETF screens',
    permission: 'analysis:read',
    module: 'analysis',
    call: () => analysisApi.etfScreens(),
    check: isList,
  },
  {
    name: 'Bonds: auctions',
    permission: 'market:read',
    call: () => bondsApi.auctions({}),
    check: isList,
  },
  {
    name: 'Bonds: yield curves',
    permission: 'analysis:read',
    module: 'analysis',
    call: () => bondsApi.yieldCurves({}),
    check: isList,
  },
  {
    name: 'Portfolios: list',
    permission: 'portfolios:read',
    module: 'portfolio',
    call: () => portfoliosApi.list(),
    check: isList,
  },
  {
    name: 'Content: news',
    permission: 'market:read',
    call: () => contentApi.news({}, { page: 1, pageSize: 5 }),
    check: isPage,
  },
  {
    name: 'Content: documents',
    permission: 'market:read',
    call: () => contentApi.documents({}, { page: 1, pageSize: 5 }),
    check: isPage,
  },
  {
    name: 'Content: calendar',
    permission: 'market:read',
    call: () => contentApi.calendar({ from: '2026-11-01', to: '2026-11-30' }),
    check: isList,
  },
  { name: 'Alerts: list', permission: 'alerts:write', call: () => alertsApi.list(), check: isList },
  {
    name: 'Alerts: notifications',
    call: () => alertsApi.notifications({ page: 1, pageSize: 5 }),
    check: isPage,
  },
  { name: 'Subscriptions: current', mayBeMissing: true, call: () => subscriptionsApi.current() },
  { name: 'Subscriptions: plans', call: () => subscriptionsApi.plans(), check: isList },
  {
    name: 'Subscriptions: public plans',
    call: () => subscriptionsApi.publicPlans(),
    check: isList,
  },
  { name: 'Subscriptions: invoices', call: () => subscriptionsApi.invoices(), check: isList },
  {
    name: 'Research: library',
    permission: 'research:read',
    call: () => researchApi.library({ page: 1, pageSize: 5 }),
    check: isPage,
  },
  {
    name: 'Research: purchases',
    permission: 'research:read',
    call: () => researchApi.purchases({ page: 1, pageSize: 5 }),
    check: isPage,
  },
  { name: 'Research: rules', permission: 'publications:write', call: () => researchApi.rules() },
  {
    name: 'Research: my publications',
    permission: 'publications:write',
    call: () => researchApi.myPublications(),
    check: isList,
  },
  {
    name: 'Research: payouts',
    permission: 'publications:write',
    call: () => researchApi.payouts(),
    check: isList,
  },
  {
    name: 'Network: my profile',
    permission: 'directory:profile',
    call: () => networkApi.myProfile(),
    check: has('experiences'),
  },
  { name: 'Network: privacy', permission: 'directory:profile', call: () => networkApi.privacy() },
  {
    name: 'Network: directory',
    permission: 'directory:list',
    call: () => networkApi.directory({ page: 1, pageSize: 5 }),
    check: isPage,
  },
  { name: 'Network: facets', permission: 'directory:list', call: () => networkApi.facets() },
  { name: 'Network: specialties', call: () => networkApi.specialties(), check: isList },
  {
    name: 'Network: blocks',
    permission: 'directory:profile',
    call: () => networkApi.blocks(),
    check: isList,
  },
  {
    name: 'Messaging: conversations',
    permission: 'messages:write',
    call: () => messagingApi.conversations('all'),
    check: isList,
  },
  {
    name: 'Messaging: search',
    permission: 'messages:write',
    call: () => messagingApi.search('rapport'),
    check: isList,
  },
  {
    name: 'DataAdmin: import types',
    permission: 'data:import',
    call: () => dataAdminApi.importTypes(),
    check: isList,
  },
  {
    name: 'DataAdmin: coverage',
    permission: 'data:import',
    call: () => dataAdminApi.coverage(null),
  },
  {
    name: 'DataAdmin: imports',
    permission: 'data:import',
    call: () => dataAdminApi.imports({ page: 1, pageSize: 5 }),
    check: isPage,
  },
  {
    name: 'DataAdmin: corrections',
    permission: 'data:import',
    call: () => dataAdminApi.corrections({ securityId: null, page: 1, pageSize: 5 }),
    check: isPage,
  },
  {
    name: 'DataAdmin: EODHD status',
    permission: 'data:import',
    call: () => dataAdminApi.eodhdStatus(),
  },
  {
    name: 'Admin: users',
    permission: 'users:manage',
    call: () => adminApi.users({ pageSize: 5 }),
    check: isPage,
  },
  { name: 'Admin: counts', permission: 'users:manage', call: () => adminApi.userCounts() },
  {
    name: 'Admin: organizations',
    permission: 'users:manage',
    call: () => adminApi.organizations(),
    check: isList,
  },
  {
    name: 'Admin: status requests',
    permission: 'moderation:manage',
    call: () => adminApi.analystRequests('pending'),
    check: isList,
  },
  {
    name: 'Admin: moderation queue',
    permission: 'moderation:manage',
    call: () => adminApi.moderationQueue(null),
    check: isList,
  },
  {
    name: 'Admin: reports',
    permission: 'moderation:manage',
    call: () => adminApi.reports(),
    check: isList,
  },
  { name: 'Admin: settings', permission: 'settings:manage', call: () => adminApi.settings() },
  {
    name: 'Admin: permissions',
    permission: 'settings:manage',
    call: () => adminApi.rolePermissions('analyst'),
    check: has('role', 'permissions'),
  },
  {
    name: 'Admin: directory settings',
    permission: 'settings:manage',
    call: () => adminApi.directorySettings(),
  },
  {
    name: 'Admin: specialties',
    permission: 'settings:manage',
    call: () => adminApi.specialties(),
    check: isList,
  },
  {
    name: 'Admin: payouts',
    permission: 'payouts:manage',
    call: () => adminApi.payouts({}),
    check: isList,
  },
  {
    name: 'Admin: audit log',
    permission: 'audit:read',
    call: () => adminApi.auditLog({ pageSize: 5 }),
    check: isPage,
  },
]
