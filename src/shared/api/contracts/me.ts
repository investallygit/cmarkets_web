/** Spec section 12. The first four are clients; Data admin and Admin are CMarket employees. */
export const ACCOUNT_TYPES = [
  'student',
  'analyst',
  'manager',
  'trader',
  'dataAdmin',
  'admin',
] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

/** Keys of the API's permission-based authorization policies (spec section 12). */
export const PERMISSIONS = [
  'market:read',
  'market:realtime',
  'market:orderbook',
  'analysis:read',
  'analysis:export',
  'portfolios:read',
  'portfolios:write',
  'portfolios:reports',
  'alerts:write',
  'research:read',
  'research:buy',
  'publications:write',
  'publications:earnings',
  'data:import',
  'content:publish',
  'users:manage',
  'moderation:manage',
  'settings:manage',
  'audit:read',
] as const
export type Permission = (typeof PERMISSIONS)[number]

/** GET /me */
export interface MeDto {
  id: string
  displayName: string
  email: string
  accountType: AccountType
  organization: { id: string; name: string } | null
  language: 'fr' | 'en'
  timeZone: string
  /** Resolved by the server from the role → permission table the Admin edits. */
  permissions: Permission[]
  /** null means unlimited. */
  quotas: { portfolios: number | null; alerts: number | null }
  /** An Analyst publishes once an Admin approved the status (spec section 12); null for others. */
  analystStatus: AnalystStatus | null
}

export type AnalystStatus = 'pending' | 'approved' | 'rejected'

/** One panel of a workspace grid, in grid units. */
export interface LayoutItemDto {
  i: string
  x: number
  y: number
  w: number
  h: number
}

/** GET / PUT /me/layouts/{screen} */
export interface ScreenLayoutDto {
  screen: string
  items: LayoutItemDto[]
}
