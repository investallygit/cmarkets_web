import type { AccountType, MeDto, Permission, WatchlistColumn } from '@/shared/api/contracts'

/** Default role -> permission table of spec section 12; the Admin edits it in the real product. */
// prettier-ignore
export const ROLE_PERMISSIONS: Record<AccountType, Permission[]> = {
  student: ['market:read', 'analysis:read', 'portfolios:read', 'portfolios:write', 'alerts:write', 'research:read', 'research:buy'],
  analyst: ['market:read', 'market:orderbook', 'analysis:read', 'analysis:export', 'portfolios:read', 'portfolios:write', 'alerts:write', 'research:read', 'research:buy', 'publications:write', 'publications:earnings'],
  manager: ['market:read', 'market:orderbook', 'analysis:read', 'analysis:export', 'portfolios:read', 'portfolios:write', 'portfolios:reports', 'alerts:write', 'research:read', 'research:buy'],
  trader: ['market:read', 'market:realtime', 'market:orderbook', 'analysis:read', 'analysis:export', 'portfolios:read', 'portfolios:write', 'alerts:write', 'research:read', 'research:buy'],
  dataAdmin: ['market:read', 'market:orderbook', 'analysis:read', 'analysis:export', 'research:read', 'data:import', 'content:publish'],
  admin: ['market:read', 'research:read', 'publications:earnings', 'users:manage', 'moderation:manage', 'settings:manage', 'audit:read'],
}

/** Starting quotas of spec section 12 (null = unlimited). */
export const ROLE_QUOTAS: Record<AccountType, MeDto['quotas']> = {
  student: { portfolios: 3, alerts: 10 },
  analyst: { portfolios: 5, alerts: 50 },
  manager: { portfolios: null, alerts: 100 },
  trader: { portfolios: 5, alerts: null },
  dataAdmin: { portfolios: 0, alerts: 0 },
  admin: { portfolios: 0, alerts: 0 },
}

/** One fictitious user per account type, names taken from the screen 9 mockup (the Admin is not in it). */
// prettier-ignore
export const DEMO_USERS: Record<AccountType, Pick<MeDto, 'id' | 'displayName' | 'email' | 'organization'>> = {
  student: { id: 'user-student', displayName: 'S. Mvondo', email: 's.mvondo@university.example', organization: { id: 'org-university', name: 'University B' } },
  analyst: { id: 'user-analyst', displayName: 'K. Atangana', email: 'k.atangana@analyst.example', organization: null },
  manager: { id: 'user-manager', displayName: 'P. Owona', email: 'p.owona@asset-manager.example', organization: { id: 'org-am', name: 'Asset manager A' } },
  trader: { id: 'user-trader', displayName: 'T. Bekale', email: 't.bekale@bank.example', organization: { id: 'org-bank', name: 'Bank C' } },
  dataAdmin: { id: 'user-data-admin', displayName: 'A. Mbarga', email: 'a.mbarga@cmarket.example', organization: { id: 'org-cmarket', name: 'CMarket' } },
  admin: { id: 'user-admin', displayName: 'L. Mvogo', email: 'l.mvogo@cmarket.example', organization: { id: 'org-cmarket', name: 'CMarket' } },
}

export interface WatchlistFixture {
  id: string
  code: string
  name: string
  columns: WatchlistColumn[]
  securityIds: string[]
}

export const WATCHLIST_FIXTURES: WatchlistFixture[] = [
  {
    id: 'watchlist-1',
    code: 'W1',
    name: 'My picks',
    columns: ['last', 'changePct', 'volume', 'sparkline'],
    securityIds: [
      'SEMC',
      'SAFACAM',
      'SOCAPALM',
      'SIAT',
      'BANGE',
      'REGIONALE',
      'SCG-RE',
      'ECMR-6.25-2029',
      'GAB-6.50-2028',
    ],
  },
  {
    id: 'watchlist-2',
    code: 'W2',
    name: 'Sovereign bonds',
    columns: ['last', 'changePct', 'sparkline'],
    securityIds: ['ECMR-6.25-2029', 'GAB-6.50-2028'],
  },
]
