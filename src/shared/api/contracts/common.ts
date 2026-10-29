/** ISO 8601 timestamp in UTC, e.g. "2026-10-28T10:15:00Z" (spec section 10). */
export type IsoDateTime = string

/** ISO 8601 calendar date, e.g. "2026-10-28". */
export type IsoDate = string

/** ISO 4217 code: XAF, EUR, USD... */
export type CurrencyCode = string

/** Origin of a data point (spec section 11). */
export type DataSource = 'EODHD' | 'FILE'

/** Paginated list for ?page=1&pageSize=50 (spec section 10). */
export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}
