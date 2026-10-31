import type { IsoDate } from './common'

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

/** Types a client chooses at sign-up; an Admin creates the employee accounts (spec section 12). */
export const CLIENT_ACCOUNT_TYPES = ['student', 'analyst', 'manager', 'trader'] as const
export type ClientAccountType = (typeof CLIENT_ACCOUNT_TYPES)[number]

/** Modules of the subscription plans (spec section 6). */
export const MODULES = ['monitoring', 'analysis', 'portfolio'] as const
export type ModuleCode = (typeof MODULES)[number]

export type UserLanguage = 'fr' | 'en'

/** Where the one-time login codes go. */
export type OtpChannel = 'email' | 'sms'

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
  'payouts:manage',
] as const
export type Permission = (typeof PERMISSIONS)[number]

/** GET /me */
export interface MeDto {
  id: string
  displayName: string
  email: string
  accountType: AccountType
  organization: { id: string; name: string } | null
  language: UserLanguage
  /** IANA time zone in which the user reads dates and times; the session clock stays in Douala. */
  timeZone: string
  /** For SMS alerts and SMS login codes. */
  phone: string | null
  twoFactorChannel: OtpChannel
  /** Resolved by the server from the role → permission table the Admin edits. */
  permissions: Permission[]
  /** null means unlimited. */
  quotas: { portfolios: number | null; alerts: number | null }
  /** An Analyst publishes once an Admin approved the status (spec section 12); null for others. */
  analystStatus: AnalystStatus | null
  /** Modules of the plan or the free trial that covers the user; all of them for employees. */
  modules: ModuleCode[]
  /** First day after the free trial, while it runs. */
  trialEndsAt: IsoDate | null
}

export type AnalystStatus = 'pending' | 'approved' | 'rejected'

/** PUT /me: the profile edited in CFG. */
export interface MeUpdateDto {
  displayName: string
  phone: string | null
  language: UserLanguage
  timeZone: string
  twoFactorChannel: OtpChannel
}

/** PUT /me/password: the user's other sessions are logged out. */
export interface PasswordChangeDto {
  currentPassword: string
  newPassword: string
}

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
