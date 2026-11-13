import type { CurrencyCode, IsoDate } from './common'

/**
 * A currency CMarket quotes against the CFA franc (spec section 9, screen 26): its names, and the
 * units its XAF value is given for, 100 for the yen.
 */
export interface FxCurrencyDto {
  code: CurrencyCode
  nameEn: string
  nameFr: string
  unit: number
}

/**
 * The changes of a currency's XAF value, in percent: since the publication before, a month, the
 * last publication of the year before, a year. Positive, the currency gained against the franc;
 * null without a rate at the start.
 */
export interface XafCrossChangesDto {
  day: number | null
  month: number | null
  ytd: number | null
  year: number | null
}

/**
 * A currency against the franc on the ECB's reference rate of its day: the rate for 1 EUR, as the
 * ECB publishes it, and the XAF for `unit` units (655.957 / ECB rate × unit).
 */
export interface XafCrossDto {
  currency: CurrencyCode
  nameEn: string
  nameFr: string
  unit: number
  /** The day of the rate: the latest publication on or before the day asked. */
  date: IsoDate
  ecbRate: number
  xaf: number
  changes: XafCrossChangesDto
}

/**
 * GET /fx/xaf-crosses?date=: the parity (1 EUR = 655.957 XAF), the day of the reference rates
 * (null before a first load), the currencies the Admin chose, in their order; a currency without
 * a rate yet is left out.
 */
export interface XafCrossesDto {
  parity: number
  date: IsoDate | null
  crosses: XafCrossDto[]
}

/** A day of a currency against the franc: the XAF for its unit. */
export interface FxHistoryPointDto {
  date: IsoDate
  value: number
}

/**
 * The year to a currency's last point: its value, its high and low, and the annualised
 * volatility of its daily changes in percent (null below three publications).
 */
export interface FxYearDto {
  date: IsoDate
  last: number
  high: number
  low: number
  volatility: number | null
}

/** Each publication, or the last of each week for the long periods. */
export type FxInterval = '1d' | '1w'

/**
 * GET /fx/{ccy}/history?from=&to=&interval=: the XAF for the currency's unit, oldest first, and the
 * year to its last point.
 */
export interface FxHistoryDto {
  currency: CurrencyCode
  unit: number
  points: FxHistoryPointDto[]
  year: FxYearDto | null
}

/**
 * GET /fx/convert?amount=&from=&to=&date=: the amount at `rate` (units of `to` for 1 `from`) from
 * the reference rates of `date`; between the euro and the franc the parity, whatever the day.
 */
export interface FxConversionDto {
  amount: number
  from: CurrencyCode
  to: CurrencyCode
  result: number
  rate: number
  /** Null at the parity. */
  date: IsoDate | null
  fixedParity: boolean
}

/**
 * GET /fx/matrix?currencies=: "1 unit in row = … in column", `rates[i][j]` the units of
 * `currencies[j]` for 1 of `currencies[i]`; null on the diagonal or without a rate.
 */
export interface FxMatrixDto {
  date: IsoDate | null
  currencies: CurrencyCode[]
  rates: (number | null)[][]
}
