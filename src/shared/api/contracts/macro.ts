import type { IsoDate } from './common'

/**
 * What an economy is to ECO (screen 25): a CEMAC state, a World Bank aggregate (Sub-Saharan
 * Africa, the World) or a country the Admin compares them with.
 */
export type MacroEconomyKind = 'cemac' | 'aggregate' | 'country'

/** The six groups of spec section 9, "Indicators offered". */
export type MacroCategory =
  | 'nationalAccounts'
  | 'prices'
  | 'externalTrade'
  | 'publicFinance'
  | 'populationAndEmployment'
  | 'marketsAndEnvironment'

/**
 * The unit of an indicator's figures: current US dollars, international dollars at purchasing
 * power parity, percent (5 for 5 %), an index (2010 = 100), people, years, a plain number, per 100
 * people, tonnes per capita, square kilometres.
 */
export type MacroUnit =
  | 'usd'
  | 'internationalDollar'
  | 'percent'
  | 'index'
  | 'people'
  | 'years'
  | 'number'
  | 'perHundred'
  | 'tonnes'
  | 'squareKm'

/**
 * Who published a figure: the World Bank (EODHD's series), or the source a Data admin's "Macro"
 * file names: the BEAC, the IMF, a ministry, the national statistics office.
 */
export type MacroPublisher = 'worldBank' | 'beac' | 'imf' | 'ministry' | 'statistics'

/** GET /macro/countries: an economy by its World Bank code ("CMR", "SSF"), with its names. */
export interface MacroCountryDto {
  code: string
  kind: MacroEconomyKind
  nameEn: string
  nameFr: string
  /** The selector's and the table's: "CAR", "Sub-Saharan Afr.". */
  shortNameEn: string
  shortNameFr: string
}

/**
 * GET /macro/indicators: an indicator ECO offers (37), by its code ("gdpGrowth"), its key in the
 * spec's table ("gdp_growth_annual"), its group, its unit and its names without the unit.
 */
export interface MacroIndicatorInfoDto {
  id: string
  key: string
  category: MacroCategory
  unit: MacroUnit
  nameEn: string
  nameFr: string
}

/** A year's figure, who published it and a file's comment (the report it comes from). */
export interface MacroYearDto {
  year: number
  value: number
  publisher: MacroPublisher
  comment: string | null
}

/**
 * A key indicator tile: its latest figure (null: the series is not published), whether that
 * figure is recent enough to show (false: "n/a", no figure for ten years), and its seven years.
 */
export interface MacroTileDto {
  indicator: string
  unit: MacroUnit
  nameEn: string
  nameFr: string
  latest: MacroYearDto | null
  current: boolean
  /** Oldest first, the latest year included. */
  history: MacroYearDto[]
}

/** GET /macro/countries/{iso3}/summary: the six tiles the Admin chose, in their order. */
export interface MacroSummaryDto {
  country: MacroCountryDto
  /** The latest year any indicator has a figure of; null before a first load. */
  latestYear: number | null
  tiles: MacroTileDto[]
}

/** An economy's figures of the indicator compared, oldest first; none when it has none. */
export interface MacroComparisonSeriesDto {
  country: string
  points: MacroYearDto[]
}

/**
 * GET /macro/compare?countries=&indicator=&from=&to=: an indicator's yearly figures for up to six
 * economies, in the order asked.
 */
export interface MacroComparisonDto {
  indicator: string
  unit: MacroUnit
  nameEn: string
  nameFr: string
  series: MacroComparisonSeriesDto[]
}

/** An economy's latest figure of a row (null: "n/a") and whether it is recent enough to show. */
export interface CemacTableCellDto {
  country: string
  latest: MacroYearDto | null
  current: boolean
}

/** A row: the indicator, the latest year of the figures it shows, a cell per column. */
export interface CemacTableRowDto {
  indicator: string
  unit: MacroUnit
  nameEn: string
  nameFr: string
  /** Null when every economy's figure is missing or older than ten years. */
  year: number | null
  values: CemacTableCellDto[]
}

/** GET /macro/cemac-table?indicators=: the CEMAC's six and Sub-Saharan Africa, then the rows. */
export interface CemacTableDto {
  countries: MacroCountryDto[]
  rows: CemacTableRowDto[]
}

/**
 * GET /macro?country= (the country page): an indicator of a country, its latest figure and its
 * history; not shown by any screen yet.
 */
export interface MacroIndicatorDto {
  id: string
  category: MacroCategory
  unit: MacroUnit
  date: IsoDate
  value: number
  source: string
  history: { date: IsoDate; value: number }[]
}
