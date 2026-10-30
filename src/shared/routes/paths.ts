import type { SecurityType } from '@/shared/api/contracts'

/** Route patterns, shared by the router (app/) and by features that link to other screens. */
export const routes = {
  market: '/mkt',
  security: '/securities/:securityId/:fn',
  screener: '/eqs',
  yieldCurves: '/ycrv',
  bondCalculator: '/yas/:bondId',
  portfolio: '/port',
  /** A portfolio and one of its tabs: /port/{id} (positions), /port/{id}/risk... */
  portfolioTabs: '/port/:portfolioId?/:tab?',
  library: '/pub',
  publishingStudio: '/pub/new',
  news: '/n',
  /** Tabs of the N screen: /n (news) and /n/documents. */
  newsTabs: '/n/:tab?',
  calendar: '/cal',
  alerts: '/alrt',
  settings: '/cfg',
  dataSession: '/data/session',
  dataImport: '/imp',
  dataCorrections: '/data/corrections',
  dataContent: '/data/content',
  dataEodhd: '/data/eodhd',
  dataHistory: '/data/history',
  adminUsers: '/admin/users',
  adminAnalysts: '/admin/analysts',
  adminModeration: '/admin/moderation',
  adminPayouts: '/admin/payouts',
  adminSettings: '/admin/settings',
  adminAudit: '/admin/audit',
} as const

/** Tabs of the security profile, each matching a command bar code (spec section 9, screen 2). */
export const SECURITY_FUNCTIONS = ['des', 'gp', 'fa', 'dvd', 'n', 'doc', 'hds', 'ana'] as const
export type SecurityFunction = (typeof SECURITY_FUNCTIONS)[number]

/** Fundamentals, dividends and shareholders only exist for equities. */
const EQUITY_ONLY_FUNCTIONS: ReadonlySet<SecurityFunction> = new Set(['fa', 'dvd', 'hds'])

/** Security types a tab of the profile applies to; all types when absent. */
export function securityFunctionTypes(fn: SecurityFunction): readonly SecurityType[] | undefined {
  return EQUITY_ONLY_FUNCTIONS.has(fn) ? ['equity'] : undefined
}

export function isSecurityFunction(value: string | undefined): value is SecurityFunction {
  return SECURITY_FUNCTIONS.some((fn) => fn === value)
}

export function securityPath(securityId: string, fn: SecurityFunction = 'des'): string {
  return `/securities/${encodeURIComponent(securityId)}/${fn}`
}

/** Tabs of the N screen: the news feed and the document library (spec section 5). */
export const NEWS_TABS = ['news', 'documents'] as const
export type NewsTab = (typeof NEWS_TABS)[number]

/** The N screen, with an article open: "/n?article=news-1". */
export function newsPath(articleId?: string): string {
  return articleId ? `${routes.news}?article=${encodeURIComponent(articleId)}` : routes.news
}

export function newsTabPath(tab: NewsTab): string {
  return tab === 'news' ? routes.news : `${routes.news}/${tab}`
}

export function bondCalculatorPath(bondId: string): string {
  return `/yas/${encodeURIComponent(bondId)}`
}

/** Tabs of the portfolio screen (spec section 9, screen 5); positions is the default. */
export const PORTFOLIO_TABS = [
  'positions',
  'transactions',
  'performance',
  'risk',
  'income',
  'reports',
] as const
export type PortfolioTab = (typeof PORTFOLIO_TABS)[number]

export function isPortfolioTab(value: string | undefined): value is PortfolioTab {
  return PORTFOLIO_TABS.some((tab) => tab === value)
}

export function portfolioPath(portfolioId: string, tab: PortfolioTab = 'positions'): string {
  const base = `${routes.portfolio}/${encodeURIComponent(portfolioId)}`
  return tab === 'positions' ? base : `${base}/${tab}`
}
