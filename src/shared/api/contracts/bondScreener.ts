import type { CurrencyCode, IsoDate, IsoDateTime } from './common'

// BS, the bond screener (spec, screen 17): the daily calculation of spec sections 11 and 14.4.
// Prices per 100 of the principal outstanding, yields in percent compounded at the coupon
// frequency, spreads in basis points, durations and lives in years.

/** Who issues the bond, as the bond list writes it (SOVEREIGN, SUPRANATIONAL...). */
export const BOND_ISSUER_CATEGORIES = [
  'sovereign',
  'supranational',
  'regional',
  'corporate',
  'municipal',
] as const
export type BondIssuerCategory = (typeof BOND_ISSUER_CATEGORIES)[number]

/** BVMAC for listed bonds, BEAC for the states' BTA and OTA, another market. */
export const BOND_MARKETS = ['bvmac', 'beac', 'other'] as const
export type BondMarket = (typeof BOND_MARKETS)[number]

export const COUPON_TYPES = ['fixed', 'float', 'zero', 'stepUp', 'inflation'] as const
export type CouponType = (typeof COUPON_TYPES)[number]

export type BondSector = 'financials' | 'utilities' | 'industrials'

export type BondSeniority = 'seniorUnsecured' | 'subordinatedT2' | 'at1' | 'covered' | 'securitized'

export const BOND_PAYMENT_STATUSES = ['performing', 'default', 'restructured'] as const
export type BondPaymentStatus = (typeof BOND_PAYMENT_STATUSES)[number]

export type RatingAgency = 'sp' | 'moodys' | 'fitch'

/** Investment Grade from BBB- / Baa3 up (spec section 14.4). */
export type CreditBucket = 'investmentGrade' | 'highYield' | 'notRated'

/** The last BVMAC quote under 5 sessions old, or a model price (an asterisk), or none. */
export type BondPriceSource = 'quote' | 'model' | 'none'

/** The columns GET /bonds/screener sorts by; "-" first for the largest first. */
export type BondScreenerSortKey =
  | 'code'
  | 'issuer'
  | 'market'
  | 'coupon'
  | 'maturity'
  | 'cleanPrice'
  | 'dirtyPrice'
  | 'ytm'
  | 'ytw'
  | 'currentYield'
  | 'spread'
  | 'rating'
  | 'duration'

/**
 * GET /bonds/screener: lists separated by commas; ytmMin keeps the yields above it, the durations
 * and the maturities are bounds included, ratingMin keeps the composite ratings as good or better.
 */
export interface BondScreenerQuery {
  issuerCategory?: string
  market?: string
  ytmMin?: number
  durationMin?: number
  durationMax?: number
  maturityFrom?: IsoDate
  maturityTo?: IsoDate
  country?: string
  currency?: string
  /** On S&P's scale: "BBB-". */
  ratingMin?: string
  couponType?: CouponType
  status?: BondPaymentStatus
  sort?: BondScreenerSortKey | `-${BondScreenerSortKey}`
  page?: number
  pageSize?: number
}

export interface BondScreenerRowDto {
  bondId: string
  code: string
  name: string
  issuer: string
  issuerCategory: BondIssuerCategory
  country: string
  currency: CurrencyCode
  market: BondMarket
  couponType: CouponType
  couponPct: number
  maturityDate: IsoDate
  priceSource: BondPriceSource
  cleanPrice: number | null
  dirtyPrice: number | null
  ytmPct: number | null
  ytwPct: number | null
  /** The call date (or maturity) the yield to worst assumes. */
  ytwDate: IsoDate | null
  /** Null for a zero coupon. */
  currentYieldPct: number | null
  /** Credit spread over the currency's reference curve. */
  spreadBp: number | null
  /** Composite rating on S&P's scale; null when not rated. */
  rating: string | null
  modifiedDuration: number | null
}

export interface BondScreenerResultDto {
  /** The session of the calculations; null before the first one. */
  date: IsoDate | null
  computedAt: IsoDateTime | null
  /** Bonds of the day's calculations, before the criteria. */
  universe: number
  total: number
  page: number
  pageSize: number
  items: BondScreenerRowDto[]
}

/** GET /bonds/screener/facets: the values each filter finds in the day's calculations. */
export interface BondScreenerFacetsDto {
  date: IsoDate | null
  issuerCategories: BondIssuerCategory[]
  markets: BondMarket[]
  countries: string[]
  currencies: CurrencyCode[]
  ratings: string[]
  couponTypes: CouponType[]
  statuses: BondPaymentStatus[]
  ytm: { min: number; max: number } | null
  modifiedDuration: { min: number; max: number } | null
  maturity: { from: IsoDate; to: IsoDate } | null
}

export interface BondRatingDto {
  agency: RatingAgency
  rating: string
  ratedOn: IsoDate
}

export interface BondOptionDto {
  date: IsoDate
  price: number
}

/**
 * GET /bonds/{id}/analytics?date=: the four blocks of the selected bond (screen 17), on its latest
 * calculation up to the date; the dates are null before its first calculation.
 */
export interface BondAnalyticsDto {
  bondId: string
  date: IsoDate | null
  settlementDate: IsoDate | null
  computedAt: IsoDateTime | null
  /** A. Identification and issuer. */
  identification: {
    isin: string | null
    code: string
    name: string
    issuer: string
    issuerCategory: BondIssuerCategory
    sector: BondSector | null
    country: string
    currency: CurrencyCode
    market: BondMarket
    seniority: BondSeniority
  }
  /** B. Pricing, yield and spreads; the OAS is null ("n/a", V2) for a bond with options. */
  pricing: {
    priceSource: BondPriceSource
    quoteDate: IsoDate | null
    cleanPrice: number | null
    dirtyPrice: number | null
    accruedInterest: number | null
    ytmPct: number | null
    ytwPct: number | null
    ytwDate: IsoDate | null
    ytwPrice: number | null
    currentYieldPct: number | null
    creditSpreadBp: number | null
    zSpreadBp: number | null
    oasBp: number | null
    hasOptions: boolean
    /** The CEMAC curve the spreads were read on; null for a currency without one. */
    referenceCurve: string | null
  }
  /** C. Risk and ratings. */
  risk: {
    ratings: BondRatingDto[]
    composite: string | null
    bucket: CreditBucket
    macaulayDuration: number | null
    modifiedDuration: number | null
    effectiveDuration: number | null
    effectiveConvexity: number | null
    timeToMaturity: number | null
  }
  /** D. Cash flow and structure. */
  structure: {
    couponPct: number
    couponType: CouponType
    floatIndex: string | null
    floatMarginPct: number | null
    frequency: number
    dayCount: string
    issueDate: IsoDate
    firstCouponDate: IsoDate | null
    maturityDate: IsoDate
    amortization: 'bullet' | 'straight' | 'schedule'
    nextCall: BondOptionDto | null
    nextPut: BondOptionDto | null
    status: BondPaymentStatus
    nominal: number
    amountOutstanding: number
  }
}

/** GET /bonds/{id}/analytics/history?from=&to=: a day of the bond's calculations. */
export interface BondAnalyticsDayDto {
  date: IsoDate
  priceSource: BondPriceSource
  cleanPrice: number | null
  dirtyPrice: number | null
  ytmPct: number | null
  ytwPct: number | null
  creditSpreadBp: number | null
  modifiedDuration: number | null
}

/** The criteria of a saved bond screen: empty lists and nulls keep every bond. */
export interface BondScreenCriteriaDto {
  issuerCategories: BondIssuerCategory[]
  markets: BondMarket[]
  ytmMin: number | null
  durationMin: number | null
  durationMax: number | null
  maturityFrom: IsoDate | null
  maturityTo: IsoDate | null
  country: string | null
  currency: string | null
  ratingMin: string | null
  couponType: CouponType | null
  status: BondPaymentStatus | null
}

/** GET /analysis/bond-screens: a saved bond screen. */
export interface SavedBondScreenDto {
  id: string
  name: string
  criteria: BondScreenCriteriaDto
}

/** POST /analysis/bond-screens returns the SavedBondScreenDto created. */
export interface SavedBondScreenInputDto {
  name: string
  criteria: BondScreenCriteriaDto
}
