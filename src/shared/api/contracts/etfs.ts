import type { CurrencyCode, IsoDate, IsoDateTime } from './common'

// ETFS, the ETF screener (spec, screen 15), and the ETF profile (screen 19): the ETF data of spec
// section 11 and the metrics of section 14.5, worked out every evening. Returns, volatilities,
// fees and yields in percent; amounts in the ETF's trading currency.

/** The asset class (block A). */
export const ETF_ASSET_CLASSES = [
  'equity',
  'fixedIncome',
  'commodity',
  'realEstate',
  'multiAsset',
  'currency',
] as const
export type EtfAssetClass = (typeof ETF_ASSET_CLASSES)[number]

/** Where the fund invests, as the "ETF profiles" file writes it (GLOBAL, US, EMERGING_MARKETS...). */
export const ETF_GEOGRAPHIES = [
  'global',
  'us',
  'europe',
  'eurozone',
  'unitedKingdom',
  'emergingMarkets',
  'asiaPacific',
  'japan',
  'china',
  'france',
  'germany',
] as const
export type EtfGeography = (typeof ETF_GEOGRAPHIES)[number]

/** The sector of a sector fund; none for a fund of the whole market. */
export const ETF_SECTORS = [
  'technology',
  'healthCare',
  'financials',
  'energy',
  'cleanEnergy',
  'consumer',
  'industrials',
  'materials',
  'utilities',
  'communication',
] as const
export type EtfSector = (typeof ETF_SECTORS)[number]

/** Full or sampled physical replication, or a swap (block B). */
export type EtfReplication = 'physicalFull' | 'physicalSampled' | 'synthetic'

/** Accumulating (Acc) or distributing (Dist) its income. */
export type EtfDistribution = 'accumulating' | 'distributing'

export type DistributionFrequency = 'monthly' | 'quarterly' | 'semiAnnual' | 'annual'

/** The periods of block E (spec section 10: periods=1D,1M,3M,YTD,1Y,3Y,5Y,SI). */
export const ETF_PERIODS = ['1D', '1M', '3M', 'YTD', '1Y', '3Y', '5Y', 'SI'] as const
export type EtfPeriod = (typeof ETF_PERIODS)[number]

/** The columns GET /etfs sorts by; "-" first for the largest first. */
export type EtfSortKey =
  | 'code'
  | 'name'
  | 'assetClass'
  | 'issuer'
  | 'exchange'
  | 'ter'
  | 'aum'
  | 'ytd'
  | 'oneYear'
  | 'sharpe'
  | 'volatility'

/**
 * GET /etfs: lists separated by commas; ytdMin and sharpeMin keep the figures above them, terMax
 * the fees below it; ucits, hedged and distribution keep the funds of that kind only.
 */
export interface EtfScreenerQuery {
  assetClass?: string
  subCategory?: string
  geography?: string
  sector?: string
  /** The issuers, by name ("BlackRock,Vanguard"). */
  provider?: string
  /** Listing exchanges, by code ("LSE,XETRA"). */
  exchange?: string
  ucits?: boolean
  distribution?: EtfDistribution
  hedged?: boolean
  terMax?: number
  ytdMin?: number
  sharpeMin?: number
  /** A column; the largest funds first by default. */
  sort?: EtfSortKey | `-${EtfSortKey}`
  page?: number
  pageSize?: number
}

/** GET /etfs: an ETF of the latest calculation. */
export interface EtfScreenerRowDto {
  /** The listing's security id, e.g. "IWDA.LSE". */
  etfId: string
  /** The ticker, e.g. "IWDA". */
  code: string
  /** The fund's full name, e.g. "iShares Core MSCI World UCITS ETF". */
  name: string
  /** The name of the lists, e.g. "iShares Core MSCI World". */
  shortName: string
  assetClass: EtfAssetClass
  subCategory: string
  geography: EtfGeography
  sector: EtfSector | null
  /** The provider, e.g. "BlackRock". */
  issuer: string
  /** The listing exchange's code: LSE, XETRA, PA, US. */
  exchange: string
  /** The trading currency. */
  currency: CurrencyCode
  /** The fund's domicile (ISO), whose flag shows left of the ticker. */
  domicile: string
  terPct: number
  /** Assets under management, in the trading currency. */
  aum: number | null
  ytdPct: number | null
  oneYearPct: number | null
  /** Over one year, on the risk-free rate of the trading currency (spec section 14.3). */
  sharpe: number | null
  volatility1yPct: number | null
}

/** The ETFs kept, a page of them; the date and time of the calculation they come from. */
export interface EtfScreenerResultDto {
  date: IsoDate | null
  computedAt: IsoDateTime | null
  /** The ETFs calculated, before the criteria. */
  universe: number
  total: number
  page: number
  pageSize: number
  items: EtfScreenerRowDto[]
}

/** A value a filter finds, and the ETFs that have it. */
export interface EtfFacetDto<T extends string = string> {
  value: T
  count: number
}

/** GET /etfs/facets: the values of each filter in the latest calculation, with their counts. */
export interface EtfFacetsDto {
  date: IsoDate | null
  assetClasses: EtfFacetDto<EtfAssetClass>[]
  subCategories: EtfFacetDto[]
  geographies: EtfFacetDto<EtfGeography>[]
  sectors: EtfFacetDto<EtfSector>[]
  providers: EtfFacetDto[]
  exchanges: EtfFacetDto[]
}

/** Block A: identification. */
export interface EtfIdentificationDto {
  code: string
  name: string
  shortName: string
  isin: string | null
  assetClass: EtfAssetClass
  subCategory: string
  geography: EtfGeography
  sector: EtfSector | null
  issuer: string
  /** The provider's brand, e.g. "iShares". */
  brand: string | null
  exchange: string
  /** The listing exchange's country (ISO), whose flag shows by the ticker. */
  listingCountry: string
  currency: CurrencyCode
}

/** Block B: fund structure. */
export interface EtfStructureDto {
  replication: EtfReplication
  distribution: EtfDistribution
  ucits: boolean
  fundCurrency: CurrencyCode
  hedged: boolean
  /** Domicile and tax residency (ISO). */
  domicile: string
}

/** Block C: size, liquidity and pricing, from the latest session calculated. */
export interface EtfSizeDto {
  aum: number | null
  aumDate: IsoDate | null
  price: number | null
  nav: number | null
  /** (Price − NAV) / NAV × 100; null without a NAV that day. */
  premiumDiscountPct: number | null
  /** 30-day average daily volume, in shares and in value. */
  averageVolume: number | null
  averageValue: number | null
  /** 30-day average bid-ask spread, in percent of the mid (× 100 for basis points). */
  averageSpreadPct: number | null
}

/** Block D: costs and yield. */
export interface EtfCostsDto {
  terPct: number
  /** Distributions of the last 12 months over the last price; null for an accumulating fund. */
  distributionYieldPct: number | null
  distributionFrequency: DistributionFrequency | null
}

/** GET /etfs/{id}: blocks A to D. */
export interface EtfDto {
  etfId: string
  /** The session the figures of block C come from; null before the first calculation. */
  date: IsoDate | null
  computedAt: IsoDateTime | null
  identification: EtfIdentificationDto
  structure: EtfStructureDto
  size: EtfSizeDto
  costs: EtfCostsDto
  /** The benchmark index, e.g. "MSCI World". */
  benchmark: string | null
  inceptionDate: IsoDate | null
}

/** A period of block E: the ETF's total return, its index's and the gap in points. */
export interface EtfReturnDto {
  period: EtfPeriod
  etfPct: number | null
  indexPct: number | null
  gapPts: number | null
  /** 3Y, 5Y and since inception, per year. */
  annualized: boolean
}

/** GET /etfs/{id}/performance?periods=: block E. */
export interface EtfPerformanceDto {
  etfId: string
  date: IsoDate | null
  computedAt: IsoDateTime | null
  benchmark: string | null
  returns: EtfReturnDto[]
  /** Over one year: the ETF's daily returns less the index's, annualized. */
  trackingErrorPct: number | null
  /** The 1Y return less the index's. */
  trackingDifferencePct: number | null
  volatility1yPct: number | null
  volatility3yPct: number | null
  sharpe: number | null
  /** The rate the Sharpe ratio is worked out on, the trading currency's. */
  riskFreeRatePct: number | null
  /** Over one year, with its peak and trough. */
  maxDrawdownPct: number | null
  maxDrawdownPeak: IsoDate | null
  maxDrawdownTrough: IsoDate | null
  averageSpreadPct: number | null
}

export interface EtfDistributionItemDto {
  exDate: IsoDate
  paymentDate: IsoDate
  amount: number
  currency: CurrencyCode
}

/** GET /etfs/{id}/distributions: what the fund paid, the latest first. */
export interface EtfDistributionsDto {
  etfId: string
  distribution: EtfDistribution
  frequency: DistributionFrequency | null
  trailingYieldPct: number | null
  items: EtfDistributionItemDto[]
}

/** The criteria of a saved ETF screen, as GET /etfs takes them; empty lists and nulls keep every ETF. */
export interface EtfScreenCriteriaDto {
  assetClasses: EtfAssetClass[]
  subCategories: string[]
  geographies: EtfGeography[]
  sectors: EtfSector[]
  providers: string[]
  exchanges: string[]
  ytdMin: number | null
  sharpeMin: number | null
  terMax: number | null
  ucitsOnly: boolean
  accumulatingOnly: boolean
  hedgedOnly: boolean
}

/** GET /analysis/etf-screens: a saved ETF screen. */
export interface SavedEtfScreenDto {
  id: string
  name: string
  criteria: EtfScreenCriteriaDto
}

/** POST /analysis/etf-screens returns the SavedEtfScreenDto created. */
export interface SavedEtfScreenInputDto {
  name: string
  criteria: EtfScreenCriteriaDto
}
