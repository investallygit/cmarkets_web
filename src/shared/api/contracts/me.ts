import type { IsoDate } from './common'

/**
 * Spec section 12. The first seven are clients, the News provider added by the third version;
 * Data admin and Admin are CMarket employees.
 */
export const ACCOUNT_TYPES = [
  'student',
  'analyst',
  'manager',
  'trader',
  'journalist',
  'ceo',
  'newsProvider',
  'dataAdmin',
  'admin',
] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

/** Types a client chooses at sign-up; an Admin creates the employee accounts (spec section 12). */
export const CLIENT_ACCOUNT_TYPES = [
  'student',
  'analyst',
  'manager',
  'trader',
  'journalist',
  'ceo',
  'newsProvider',
] as const
export type ClientAccountType = (typeof CLIENT_ACCOUNT_TYPES)[number]

/**
 * Types whose status an Admin approves after the sign-up, which brings the VERIFIED badge:
 * identity and background for an Analyst, a press card or an employer letter for a Journalist,
 * a proof of position for a CEO, a letter from the media and the signed content agreement for a
 * News provider (spec section 12).
 */
export const VERIFIED_ACCOUNT_TYPES = ['analyst', 'journalist', 'ceo', 'newsProvider'] as const
export type VerifiedAccountType = (typeof VERIFIED_ACCOUNT_TYPES)[number]

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
  'analysis:save',
  'portfolios:read',
  'portfolios:write',
  'portfolios:reports',
  'alerts:write',
  'research:read',
  'research:buy',
  'publications:write',
  'publications:earnings',
  'directory:list',
  'directory:profile',
  'messages:write',
  'news:write',
  'news:stats',
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
  /**
   * An Analyst, a Journalist, a CEO or a News provider is verified once an Admin approved the status, which
   * brings the VERIFIED badge; an Analyst then publishes (spec section 12). Null for the others.
   */
  verificationStatus: VerificationStatus | null
  /** Modules of the plan or the free trial that covers the user; all of them for employees. */
  modules: ModuleCode[]
  /** First day after the free trial, while it runs. */
  trialEndsAt: IsoDate | null
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

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

/** How the panels of a screen are arranged, which a layout saved under a name keeps too. */
export interface LayoutArrangementDto {
  /** Hidden panels keep theirs, to come back to it. */
  items: LayoutItemDto[]
  /** Panels the user hid, by id. */
  hidden?: string[]
  /** Order of the panels stacked in one column, below 1280 px wide; by default the grid's. */
  stacked?: string[]
}

export interface NamedLayoutDto extends LayoutArrangementDto {
  name: string
}

/** GET / PUT /me/layouts/{screen} */
export interface ScreenLayoutDto extends LayoutArrangementDto {
  screen: string
  /** Nothing moves until the user unlocks it. */
  locked?: boolean
  /** Layouts saved under a name, up to 10, to come back to. */
  saved?: NamedLayoutDto[]
}
