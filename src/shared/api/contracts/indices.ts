import type { IsoDate } from './common'

// The index profile (spec section 9, screen 31, fifth version; CMarket.Api phase 44, ADR-070).

/** Price, or dividends reinvested. */
export type IndexKind = 'price' | 'totalReturn'

/** BVMAC's index comes from the index file; CMarket's are computed after the fixing. */
export type IndexSource = 'file' | 'cMarket'

/** The tabs of the index profile, each a command bar code: "BVMAC-A DES", "BVMAC-A MEMB". */
export const INDEX_FUNCTIONS = ['des', 'gp', 'memb', 'perf', 'doc'] as const
export type IndexFunction = (typeof INDEX_FUNCTIONS)[number]

/**
 * GET /indices/{code}: the profile's header. The value is the close of `closeDate`: the session's
 * fixing once a constituent traded, else the last close.
 */
export interface IndexProfileDto {
  code: string
  name: string
  kind: IndexKind
  source: IndexSource
  currency: string
  constituentCount: number
  closeDate: IsoDate
  value: number
  change: number
  changePct: number
  previousValue: number | null
  ytdPct: number | null
  oneYearPct: number | null
  high52Weeks: number | null
  low52Weeks: number | null
  /** The constituents' capitalisation, in billions of the index's currency. */
  marketCapBn: number
}

/** A session's close, its change from the session before, the constituents' capitalisation. */
export interface IndexSessionDto {
  session: IsoDate
  value: number
  change: number
  changePct: number
  marketCapBn: number
}

/** GET /indices/{code}/sessions?last=: newest first. */
export interface IndexSessionsDto {
  items: IndexSessionDto[]
}

/** A constituent on a session: weight at the previous close, price, change, contribution. */
export interface IndexConstituentDto {
  securityId: string
  code: string
  name: string
  sector: string
  weightPct: number
  /** The exchange's weight, not the capitalisation's. */
  publishedWeight: boolean
  price: number | null
  changePct: number
  /** Weight × change, in percentage points of the index's change. */
  contribution: number
  entryDate: IsoDate
  exitDate: IsoDate | null
}

/** GET /indices/{code}/constituents?date=: the composition in force on the session, heaviest first. */
export interface IndexConstituentsDto {
  date: IsoDate
  previousDate: IsoDate | null
  indexChangePct: number
  contributionSum: number
  constituents: IndexConstituentDto[]
}

/** GET /indices/{code}/constituents/history: every member the index had. */
export interface IndexMemberDto {
  securityId: string
  code: string
  name: string
  weightPct: number | null
  entryDate: IsoDate
  exitDate: IsoDate | null
}

/** A month's return (`month` 1 to 12) or a year's (`month` null), in percent. */
export interface IndexPeriodDto {
  year: number
  month: number | null
  returnPct: number
}

/** GET /indices/{code}/performance: in percent; null without the history it needs. */
export interface IndexPerformanceDto {
  date: IsoDate
  oneMonthPct: number | null
  threeMonthsPct: number | null
  ytdPct: number | null
  oneYearPct: number | null
  threeYearsAnnualisedPct: number | null
  volatilityPct: number | null
  maxDrawdownPct: number | null
  dividendYieldPct: number | null
  months: IndexPeriodDto[]
  years: IndexPeriodDto[]
}
