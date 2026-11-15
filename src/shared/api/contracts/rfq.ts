import type { IsoDateTime, TimeOfDay } from './common'
import type { AccountType } from './me'

/**
 * A trader's link to an SVT (spec, screen 22, "Linking a trader to an SVT"): asked by the trader,
 * confirmed or declined by the bank's SVT accounts, expired after 7 days without an answer or once
 * the confirmation is due again, withdrawn by either side.
 */
export type SvtLinkStatus = 'pending' | 'confirmed' | 'declined' | 'expired' | 'withdrawn'

/** Who withdrew a link: the trader who removed the SVT, or the SVT that removed the link. */
export type SvtLinkParty = 'trader' | 'svt'

/** A bank of the licensed SVTs, which the Admin keeps (ADMCFG). */
export interface LicensedSvtDto {
  id: string
  name: string
}

/** A trader's link to an SVT, as "My SVTs" shows it (screen 22). */
export interface SvtLinkDto {
  id: string
  svtId: string
  svtName: string
  status: SvtLinkStatus
  requestedAt: IsoDateTime
  /** A request's last moment, then a confirmation's: past it, the link has expired. */
  expiresAt: IsoDateTime
  decidedAt: IsoDateTime | null
  endedAt: IsoDateTime | null
  endedBy: SvtLinkParty | null
  /** The most the client trades a day through this SVT, XAF; null: no limit. */
  dailyLimit: number | null
}

/** GET /me/svt: each SVT's latest link, confirmed first; the SVTs of the list, to ask. */
export interface MySvtsDto {
  links: SvtLinkDto[]
  svts: LicensedSvtDto[]
}

/** POST /me/svt */
export interface SvtLinkRequestInput {
  svtId: string
}

export interface LinkedTraderDto {
  id: string
  name: string
  organization: string | null
  accountType: AccountType
}

/** A link as the SVT's bank sees it (TRD, and screen 27's "Trader links"). */
export interface TraderLinkDto {
  id: string
  trader: LinkedTraderDto
  status: SvtLinkStatus
  requestedAt: IsoDateTime
  expiresAt: IsoDateTime
  decidedAt: IsoDateTime | null
  /** The SVT account that confirmed or declined it. */
  decidedBy: string | null
  dailyLimit: number | null
  limitChangedAt: IsoDateTime | null
}

/** GET /svt/links: the bank, its requests waiting (oldest first), then its linked traders. */
export interface SvtLinksDto {
  svt: LicensedSvtDto
  links: TraderLinkDto[]
}

/** POST /svt/links/{linkId}/confirm and PUT /svt/links/{linkId}/limit: XAF, null for no limit. */
export interface DailyLimitInput {
  dailyLimit: number | null
}

/** A licensed SVT as ADMCFG lists it, with its SVT accounts and its links in force. */
export interface AdminLicensedSvtDto {
  id: string
  /** The bank, whose SVT accounts USER creates. */
  organizationId: string
  name: string
  backOfficeEmail: string
  /** On the list: traders may ask it for a link. */
  active: boolean
  accounts: number
  links: number
}

/**
 * GET /admin/rfq/svt: the RFQ's switch, off until the BEAC confirms its status (ROADMAP decision
 * 24), the minimum trading amount, how long a link's confirmation holds, the licensed SVTs.
 */
export interface RfqAdminSettingsDto {
  enabled: boolean
  /** XAF. */
  minimumTradingAmount: number
  linkValidityMonths: number
  /** The SVTs' approval window (ROADMAP step 45): minutes, the cut-off, the next business day's deadline. */
  approvalWindowMinutes: number
  cutOffTime: TimeOfDay
  nextDayDeadline: TimeOfDay
  /**
   * The CMarket curve fed by the concluded agreements (ROADMAP step 49, decision 27): on, an
   * agreement of at least `curveFeedMinimum` XAF of face gives its state's series a point. Off,
   * from 250 million, by default.
   */
  curveFeedEnabled: boolean
  curveFeedMinimum: number
  svts: AdminLicensedSvtDto[]
  updatedAt: IsoDateTime | null
  updatedBy: string | null
}

/** A licensed SVT as ADMCFG sends it: its id once on the list, a bank's name to add one. */
export interface LicensedSvtInput {
  id: string | null
  name: string | null
  backOfficeEmail: string
  active: boolean
}

/** PUT /admin/rfq/svt: the whole list in its order; none leaves it (untick one instead). */
export interface RfqAdminSettingsInput {
  enabled: boolean
  minimumTradingAmount: number
  linkValidityMonths: number
  approvalWindowMinutes: number
  cutOffTime: TimeOfDay
  nextDayDeadline: TimeOfDay
  curveFeedEnabled: boolean
  curveFeedMinimum: number
  svts: LicensedSvtInput[]
}
