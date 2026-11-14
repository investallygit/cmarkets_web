import type { IsoDate, IsoDateTime } from './common'
import type { NewsItemDto } from './news'
import type { SecurityDescriptionDto, SecuritySearchItemDto } from './securities'

/** The groups of screen 21's list (spec section 9), in its order. */
export type CommodityCategory = 'energy' | 'metals' | 'agriculture' | 'indices' | 'cemacComplement'

/**
 * How often a series is published, the list's badge (D daily, W weekly, M monthly); also the
 * history's intervals.
 */
export type CommodityFrequency = 'daily' | 'weekly' | 'monthly'

/**
 * Where a series comes from: EODHD's commodities API (FRED's series, spec section 11), or the
 * Data admin's COMMODITY_PRICES file (the CEMAC complement).
 */
export type CommodityOrigin = 'eodhd' | 'file'

/**
 * The unit of a series' values, as the COMMODITY_PRICES file writes it: US dollars per barrel,
 * per million BTU, per gallon, per metric ton, per pound, per kilogram, per troy ounce, per cubic
 * metre; US cents per pound; an index on 2016 or 1982 = 100.
 */
export type CommodityUnit =
  | 'USD/bbl'
  | 'USD/MMBtu'
  | 'USD/gal'
  | 'USD/t'
  | 'USD/lb'
  | 'USD/kg'
  | 'USD/ozt'
  | 'USD/m3'
  | 'USc/lb'
  | 'INDEX_2016'
  | 'INDEX_1982'

/**
 * When a new value usually comes (spec section 9, "Rules"): the daily energy prices in weekly
 * batches, up to a week late; the US gasoline a day late; a monthly series two to three weeks
 * after the month; a file's series when the Data admin uploads it.
 */
export type CommodityPublicationLag = 'weeklyBatch' | 'nextDay' | 'afterMonth' | 'byFile'

/**
 * An observation: its date (a weekly series' week ends on a Friday, a monthly one's is the 1st of
 * its month) and its value, in the series' unit.
 */
export interface CommodityPointDto {
  date: IsoDate
  value: number
}

/** GET /commodities?category=: a series of the list, in its group's order. */
export interface CommodityListItemDto {
  /** The spec's code, also the security's id: "BRENT", "NATURAL_GAS", "COCOA". */
  code: string
  nameEn: string
  nameFr: string
  /** The list's: "Henry Hub nat. gas". */
  shortNameEn: string
  shortNameFr: string
  category: CommodityCategory
  unit: CommodityUnit
  frequency: CommodityFrequency
  origin: CommodityOrigin
  /** The latest value; null while the series has none (a file's not uploaded yet). */
  last: CommodityPointDto | null
  /** The value before it, which the change compares with. */
  previous: CommodityPointDto | null
  /** last / previous − 1, in percent; null without both. */
  changePct: number | null
  /**
   * The latest value is older than its series allows (spec section 9): 10 days for a daily or a
   * weekly series, 50 for a monthly one; its date then shows in yellow.
   */
  stale: boolean
}

/**
 * The statistics of a series (spec section 9, screen 21): a change is the latest value over the
 * last value known at the reference date, − 1, in percent; null when the series does not reach
 * back that far.
 */
export interface CommodityStatisticsDto {
  change1mPct: number | null
  change3mPct: number | null
  /** Since the last value of the year before. */
  changeYtdPct: number | null
  change1yPct: number | null
  /** Over five years, annualized: (latest / five years before)^(1/5) − 1. */
  change5yAnnualPct: number | null
  /** Over the twelve months to the latest value, with the date of each. */
  high12m: CommodityPointDto | null
  low12m: CommodityPointDto | null
  /** The mean of the values of the five years to the latest. */
  average5y: number | null
  /**
   * The standard deviation of the changes of a year at the series' own frequency, × √252 (daily),
   * √52 (weekly) or √12 (monthly), in percent.
   */
  volatility1yPct: number | null
  /**
   * Pearson's coefficient of the monthly changes of a year with the reference series (WTI for
   * Brent, Brent for the other energies, the all-commodities index otherwise); null under six
   * months in common.
   */
  correlation1y: { code: string; value: number } | null
}

/**
 * GET /commodities/{code}: the profile of screen 21 (its header, statistics, description and
 * data). GET /securities/{id} answers the same series with the type `commodity`.
 */
export interface CommodityProfileDto extends CommodityListItemDto {
  /**
   * The intervals the history offers: an EODHD series' frequency and the longer ones, a file's
   * series its frequency alone; the others are greyed out.
   */
  intervals: CommodityFrequency[]
  /** The codes at EODHD (the spec's) and at FRED ("DCOILBRENTEU"); null for a file's series. */
  eodhdCode: string | null
  fredCode: string | null
  /** Who publishes it at the source, in English and French: "EIA, spot prices". */
  primarySourceEn: string
  primarySourceFr: string
  publicationLag: CommodityPublicationLag
  /** The first value stored, the history's start; null without any. */
  historyStart: IsoDate | null
  /** When CMarket last stored a value of the series (a load or a file); null without any. */
  updatedAt: IsoDateTime | null
  /** The Data admin's French and English texts (CORR), null in a language without one. */
  description: SecurityDescriptionDto
  statistics: CommodityStatisticsDto
}

/** A value of the history with the moving average of the 50 values to it. */
export interface CommodityHistoryPointDto extends CommodityPointDto {
  /** Null over the first 49 values of the series. */
  average: number | null
}

/**
 * GET /commodities/{code}/history?interval=&from=&to=: the values of an interval the series
 * offers, oldest first; without from and to, its whole history.
 */
export interface CommodityHistoryDto {
  code: string
  interval: CommodityFrequency
  points: CommodityHistoryPointDto[]
}

/** A series of a comparison, rebased to 100 at the comparison's first month. */
export interface CommodityComparisonSeriesDto {
  code: string
  points: CommodityPointDto[]
}

/**
 * GET /commodities/compare?codes=&from=&to=: up to five series compared on their monthly values
 * (spec section 9: the changes of series of different frequencies stay comparable), each rebased
 * to 100 at the first month all of them have, and the correlations of their monthly changes.
 */
export interface CommodityComparisonDto {
  /** The months compared: the first all the series have, the last any has. */
  from: IsoDate | null
  to: IsoDate | null
  series: CommodityComparisonSeriesDto[]
  /**
   * Pearson's coefficients of the monthly changes, rows and columns in the order of `series`;
   * null for a pair with under six changes in common.
   */
  correlations: (number | null)[][]
}

/** GET /commodities/{code}/related: the profile's CEMAC links. */
export interface CommodityRelatedDto {
  /** The CEMAC countries exposed, ISO alpha-2 codes in the Data admin's order. */
  countries: string[]
  /** The related securities, bonds and equities, in the Data admin's order. */
  securities: SecuritySearchItemDto[]
  /** The latest news naming the commodity, newest first, five at most. */
  news: NewsItemDto[]
}

/**
 * PUT /data/commodities/{code} (CORR): the Data admin's names, French and English texts (2,000
 * characters each, an empty one removes it), the CEMAC countries exposed and the related
 * securities (10 at most). Answers the profile.
 */
export interface CommodityWriteDto {
  nameEn: string
  nameFr: string
  shortNameEn: string
  shortNameFr: string
  descriptionEn: string
  descriptionFr: string
  countries: string[]
  securityIds: string[]
}
