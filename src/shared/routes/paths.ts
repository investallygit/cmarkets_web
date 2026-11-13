import type { ClientAccountType } from '@/shared/api/contracts'

/** Route patterns, shared by the router (app/) and by features that link to other screens. */
export const routes = {
  // Outside the app shell, open without a session: the home page, the login pages, and the
  // public page of a profile.
  home: '/',
  login: '/login',
  signUp: '/signup',
  resetPassword: '/reset-password',
  publicProfile: '/p/:handle',
  /** The home screen of the user's account type: MKT, IMP or USER. */
  app: '/app',
  market: '/mkt',
  /** FX (screen 26): the CFA franc against the ECB's currencies; ?currency= picks the chart's. */
  eco: '/eco',
  fx: '/fx',
  security: '/securities/:securityId/:fn',
  screener: '/eqs',
  yieldCurves: '/ycrv',
  /** Screen 4 with its calculator on a bond: /ycrv/{bondId}. */
  yieldCurvesBond: '/ycrv/:bondId?',
  /** BP (screen 16): bond pricing, on a bond of the list or one entered by hand. */
  bondPricing: '/bp',
  bondPricingBond: '/bp/:bondId?',
  /** YAS opens BP (spec section 8): the addresses of the calculator before it lead there. */
  bondCalculatorLegacy: '/yas/:bondId?',
  /** BS (screen 17): the bond screener. */
  bondScreener: '/bs',
  /** ETFS (screen 15): the ETF screener. */
  etfScreener: '/etfs',
  portfolio: '/port',
  /** A portfolio and one of its tabs: /port/{id} (positions), /port/{id}/risk... */
  portfolioTabs: '/port/:portfolioId?/:tab?',
  library: '/pub',
  publishingStudio: '/pub/new',
  news: '/n',
  /** NEWS NEW (screen 13): a partner newspaper's news studio. */
  newsStudio: '/n/new',
  /** Tabs of the N screen: /n (news) and /n/documents. */
  newsTabs: '/n/:tab?',
  calendar: '/cal',
  alerts: '/alrt',
  settings: '/cfg',
  /** NET (screen 10): the professional directory. */
  directory: '/net',
  /** NET ME (screen 12): the user's professional profile. */
  networkProfile: '/net/me',
  /** MSG (screen 11): the messaging. */
  messages: '/msg',
  dataSession: '/data/session',
  dataImport: '/imp',
  dataCorrections: '/data/corrections',
  dataContent: '/data/content',
  dataEodhd: '/data/eodhd',
  dataHistory: '/data/history',
  adminUsers: '/admin/users',
  adminSubscriptions: '/admin/subscriptions',
  adminSources: '/admin/sources',
  adminMediaPayments: '/admin/media-payments',
  adminAnalysts: '/admin/analysts',
  adminModeration: '/admin/moderation',
  adminPayouts: '/admin/payouts',
  adminSettings: '/admin/settings',
  adminAudit: '/admin/audit',
} as const

/**
 * Tabs of the security profiles, each matching a command bar code (spec section 9, screens 2, 19
 * and 20); which profile has which tab: SECURITY_PROFILES (profiles.ts).
 */
export const SECURITY_FUNCTIONS = [
  'des',
  'gp',
  'fa',
  'dvd',
  'n',
  'doc',
  'hds',
  'ana',
  'bp',
  'cf',
  'rat',
  'hld',
  'perf',
  'dist',
] as const
export type SecurityFunction = (typeof SECURITY_FUNCTIONS)[number]

export function isSecurityFunction(value: string | undefined): value is SecurityFunction {
  return SECURITY_FUNCTIONS.some((fn) => fn === value)
}

export function securityPath(securityId: string, fn: SecurityFunction = 'des'): string {
  return `/securities/${encodeURIComponent(securityId)}/${fn}`
}

/** Tabs of the N screen: the news feed and the document library (spec section 5). */
export const NEWS_TABS = ['news', 'documents'] as const
export type NewsTab = (typeof NEWS_TABS)[number]

/**
 * The N screen, with an article open: "/n?article=news-1". It is the address of a news item,
 * which members share: whoever opens it reads the article, after logging in if need be.
 */
export function newsPath(articleId?: string): string {
  return articleId ? `${routes.news}?article=${encodeURIComponent(articleId)}` : routes.news
}

/** What a news tag filters the N screen on: its type or its newspaper (spec section 16). */
export interface NewsTagFilter {
  type?: string
  source?: string
}

/** The N screen filtered as a tag says: "/n?type=flash", "/n?source={id}". */
export function newsFilterPath({ type, source }: NewsTagFilter): string {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (source) params.set('source', source)
  const query = params.toString()
  return query ? `${routes.news}?${query}` : routes.news
}

/** The full address of a page of the app, to share: "https://…/n?article=news-1". */
export function shareableUrl(path: string): string {
  return new URL(path, window.location.origin).href
}

export function newsTabPath(tab: NewsTab): string {
  return tab === 'news' ? routes.news : `${routes.news}/${tab}`
}

/** ECO (screen 25) on an economy, by its World Bank code: /eco?country=CMR (`ECO CMR`). */
export function ecoPath(country?: string): string {
  return country ? `${routes.eco}?country=${encodeURIComponent(country.toUpperCase())}` : routes.eco
}

/** FX (screen 26), its chart on a currency: /fx?currency=USD. */
export function fxPath(currency?: string): string {
  return currency ? `${routes.fx}?currency=${encodeURIComponent(currency)}` : routes.fx
}

/** Screen 4, its calculator on the bond. */
export function yieldCurvesPath(bondId: string): string {
  return `${routes.yieldCurves}/${encodeURIComponent(bondId)}`
}

/** BP, bond pricing: on a bond of the list, or on the first one. */
export function bondPricingPath(bondId?: string): string {
  return bondId ? `${routes.bondPricing}/${encodeURIComponent(bondId)}` : routes.bondPricing
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

/** The research library with one analyst's publications: /pub?analyst=analyst-atangana. */
export function analystPublicationsPath(analystId: string): string {
  return `${routes.library}?analyst=${encodeURIComponent(analystId)}`
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

/** NET with a profile open: /net?profile=user-analyst. */
export function directoryPath(userId?: string): string {
  return withQuery(routes.directory, 'profile', userId)
}

/**
 * MSG with a conversation open, /msg?c=conversation-atangana, a message of it shown (&m=), or a
 * new one with someone of the directory, /msg?to=user-analyst.
 */
export function messagesPath({
  conversationId,
  messageId,
  to,
}: { conversationId?: string; messageId?: string; to?: string } = {}): string {
  const params = new URLSearchParams()
  if (conversationId) params.set('c', conversationId)
  if (messageId) params.set('m', messageId)
  if (to) params.set('to', to)
  const query = params.toString()
  return query ? `${routes.messages}?${query}` : routes.messages
}

/** The public page of a profile, open without login: /p/k-atangana. */
export function publicProfilePath(handle: string): string {
  return `/p/${encodeURIComponent(handle)}`
}

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

/** The login page, back to `next` once logged in; the home screen when there is none. */
export function loginPath(next?: string): string {
  return next && next !== routes.home && next !== routes.app
    ? `${routes.login}?next=${encodeURIComponent(next)}`
    : routes.login
}

/** An origin of no site, to read `next` as the browser would read it on this one. */
const NO_SITE = 'https://cmarket.invalid'

/**
 * A page of the app to go back to after login: a path of this site only, never another site;
 * otherwise the home screen of the account. The browser's URL parser decides, since it drops
 * tabs and line breaks and reads "\" as "/": "/\t/site.example" would be "//site.example".
 */
export function safeNextPath(next: string | null): string {
  if (!next?.startsWith('/')) return routes.app
  const url = new URL(next, NO_SITE)
  return url.origin === NO_SITE ? `${url.pathname}${url.search}${url.hash}` : routes.app
}

/** The sign-up page with an account type chosen, as the home page offers: /signup?type=analyst. */
export function signUpPath(accountType?: ClientAccountType): string {
  return withQuery(routes.signUp, 'type', accountType)
}
