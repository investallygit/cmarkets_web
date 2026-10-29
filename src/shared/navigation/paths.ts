/** Route patterns, shared by the router (app/) and by features that link to other screens. */
export const routes = {
  market: '/mkt',
  security: '/securities/:securityId/:fn',
  screener: '/eqs',
  yieldCurves: '/ycrv',
  bondCalculator: '/yas/:bondId',
  portfolio: '/port',
  library: '/pub',
  publishingStudio: '/pub/new',
  news: '/n',
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

export function securityPath(securityId: string, fn: SecurityFunction = 'des'): string {
  return `/securities/${encodeURIComponent(securityId)}/${fn}`
}

export function bondCalculatorPath(bondId: string): string {
  return `/yas/${encodeURIComponent(bondId)}`
}
