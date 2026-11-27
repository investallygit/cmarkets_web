/**
 * DEBT, the CEMAC states' debt on the BEAC's market (screen 35, sixth version; ROADMAP step 66).
 * CMarket.Api's Features/Debt/DebtDtos.cs. A country is a state's three-letter code (CMR, GAB,
 * COG, TCD, CAF, GNQ) or CEMAC for the whole zone; amounts are in XAF (ROADMAP decision 60).
 */
import type { IsoDate } from './common'
import type { DocumentDto } from './documents'

export type DebtInstrument = 'bta' | 'ota'
export type RatingAgencyCode = 'sp' | 'moodys' | 'fitch'
export type RatingOutlook = 'stable' | 'positive' | 'negative' | 'developing'

/** An agency's rating of the state in force; `rating` null when the agency rates it not. */
export interface SovereignRatingDto {
  agency: RatingAgencyCode
  rating: string | null
  outlook: RatingOutlook | null
  ratedOn: IsoDate | null
  /** Not from a SOVEREIGN_RATINGS upload: the demo's, shown as an example. */
  example: boolean
}

/** GET /debt/{country}/summary: the six indicators on a day. */
export interface DebtSummaryDto {
  country: string
  asOf: IsoDate
  currency: 'XAF'
  outstanding: number
  bta: number
  ota: number
  /** Weighted by the outstanding; null without any security. */
  averageMaturityYears: number | null
  averageRatePct: number | null
  /** The principal falling due within 365 days. */
  maturing12Months: number
  securities: number
  /** S&P's, Moody's and Fitch's; null when ADMCFG hides them, or for the zone. */
  ratings: SovereignRatingDto[] | null
}

/** A bar of the schedule: a quarter of the current year, a later year, or the years from `year`. */
export interface DebtPeriodDto {
  kind: 'quarter' | 'year' | 'beyond'
  year: number
  quarter: number | null
  bta: number
  ota: number
}

/** GET /debt/{country}/redemptions: the principal to repay, BTA and OTA apart. */
export interface DebtRedemptionsDto {
  country: string
  asOf: IsoDate
  total: number
  periods: DebtPeriodDto[]
}

/** A security outstanding: a BTA's rate is its auction's average, an OTA's its coupon. */
export interface DebtSecurityDto {
  securityId: string
  code: string
  country: string
  instrument: DebtInstrument
  issueDate: IsoDate
  maturityDate: IsoDate
  outstanding: number
  ratePct: number | null
  /** The last computed yield (screen 17), else a BTA's auction rate. */
  yieldPct: number | null
  yearsLeft: number
}

/** GET /debt/{country}/securities: BTAs, then OTAs, by maturity. */
export interface DebtSecuritiesDto {
  country: string
  asOf: IsoDate
  items: DebtSecurityDto[]
}

/** GET /debt/{country}/documents: the ratings (behind ADMCFG's switch) and the state's documents. */
export interface DebtDocumentsDto {
  country: string
  /** False when ADMCFG hides the agencies' ratings: `ratings` is then empty. */
  ratingsShown: boolean
  ratings: SovereignRatingDto[]
  documents: DocumentDto[]
}

export interface DebtComparisonDto {
  country: string
  outstanding: number
  btaSharePct: number | null
  averageMaturityYears: number | null
  averageRatePct: number | null
}

/** GET /debt/compare: the six states, the largest outstanding first. */
export interface DebtCompareDto {
  asOf: IsoDate
  countries: DebtComparisonDto[]
}
