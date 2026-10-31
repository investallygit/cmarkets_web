import type { SecurityType } from '@/shared/api/contracts'

/** Route patterns, shared by the router (app/) and by features that link to other screens. */
export const routes = {
  // Outside the app shell, before the session (spec section 10).
  login: '/login',
  signUp: '/signup',
  resetPassword: '/reset-password',
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

/** The research library with a publication open: /pub?id=pub-semc-volumes. */
export function libraryPath(publicationId?: string): string {
  return publicationId
    ? `${routes.library}?id=${encodeURIComponent(publicationId)}`
    : routes.library
}

/** The publishing studio with a publication open: /pub/new?id=pub-semc-volumes. */
export function studioPath(publicationId?: string): string {
  return publicationId
    ? `${routes.publishingStudio}?id=${encodeURIComponent(publicationId)}`
    : routes.publishingStudio
}

/** The data import screen with an upload open: /imp?import=import-1. */
export function dataImportPath(importId?: string): string {
  return importId
    ? `${routes.dataImport}?import=${encodeURIComponent(importId)}`
    : routes.dataImport
}

const withQuery = (path: string, name: string, value?: string) =>
  value ? `${path}?${name}=${encodeURIComponent(value)}` : path

/** USER with an account open: /admin/users?id=user-analyst. */
export function adminUserPath(userId?: string): string {
  return withQuery(routes.adminUsers, 'id', userId)
}

/** ANLY with a request open: /admin/analysts?id=user-ressomba. */
export function analystRequestPath(userId?: string): string {
  return withQuery(routes.adminAnalysts, 'id', userId)
}

/** MOD with a publication open: /admin/moderation?id=pub-gabon-oil. */
export function moderationPath(publicationId?: string): string {
  return withQuery(routes.adminModeration, 'id', publicationId)
}

/** AUDT for one account, what it did and what was done to it: /admin/audit?userId=user-mba. */
export function auditLogPath(userId?: string): string {
  return withQuery(routes.adminAudit, 'userId', userId)
}

/** The login page, back to `next` once logged in. */
export function loginPath(next?: string): string {
  return next && next !== '/' ? `${routes.login}?next=${encodeURIComponent(next)}` : routes.login
}

/** A page of the app to go back to after login: a path of this site only, never another site. */
export function safeNextPath(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : '/'
}
