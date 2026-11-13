import type { ImportDto, ImportType } from '@/shared/api/contracts'

/** File types the Data admin uploads, in the order of the session coverage of the screen 6 mockup. */
export const IMPORT_TYPES: readonly ImportType[] = [
  'daily-prices',
  'indices',
  'corporate-actions',
  'auctions',
  'cemac-sov-yields',
  'financial-statements',
  'securities',
  'history',
  'bond-master',
  'bond-ratings',
  'etf-profiles',
  'etf-nav',
]

/**
 * Files of the earlier versions of the spec, no longer uploaded: the weekly "Curves and rates",
 * which the CEMAC sovereign yields replaced. Their uploads stay in the history.
 */
export const RETIRED_IMPORT_TYPES: readonly ImportType[] = ['curves']

export function isImportType(value: string): value is ImportType {
  return [...IMPORT_TYPES, ...RETIRED_IMPORT_TYPES].some((type) => type === value)
}

/** What the history says of an upload: a rolled back file published again says both. */
export type ImportStatusLabel = ImportDto['status'] | 'republished'

export function importStatusLabel(
  upload: Pick<ImportDto, 'status' | 'rollback'>,
): ImportStatusLabel {
  return upload.status === 'published' && upload.rollback ? 'republished' : upload.status
}

/** Uploads take the CSV or Excel templates, 5 MB at most. */
export const UPLOAD_ACCEPT = '.csv,.xlsx'
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** Columns of every template (spec section 11), as named in the files. */
// prettier-ignore
export const IMPORT_COLUMNS = [
  'date', 'code', 'open', 'high', 'low', 'close', 'volume', 'value', 'index', 'type', 'ex_date',
  'pay_date', 'amount', 'country', 'security', 'maturity', 'offered', 'bids', 'allotted',
  'avg_rate', 'marginal_rate', 'rate', 'fiscal_year', 'line_item', 'isin', 'name', 'sector',
  'shares', 'currency', 'ticker', 'issuer', 'issuer_category', 'market', 'seniority', 'coupon_type',
  'coupon_rate', 'float_index', 'float_margin', 'frequency', 'day_count', 'issue_date', 'first_coupon_date',
  'maturity_date', 'redemption', 'amortization_schedule', 'call_schedule', 'put_schedule', 'face_value',
  'amount_outstanding', 'status', 'agency', 'rating', 'rating_date', 'exchange', 'short_name', 'provider', 'brand',
  'asset_class', 'sub_category', 'geography', 'replication', 'distribution', 'distribution_frequency', 'ucits',
  'hedged', 'fund_currency', 'domicile', 'ter', 'aum', 'benchmark', 'benchmark_symbol', 'inception_date', 'nav',
  'bid', 'ask', 'holdings_count', 'holdings_date', 'top_holdings', 'sector_weights', 'region_weights',
  'tenor', 'yield', 'point_type', 'reference_security', 'source', 'comment',
] as const
export type ImportColumnName = (typeof IMPORT_COLUMNS)[number]

export function isImportColumn(name: string): name is ImportColumnName {
  return IMPORT_COLUMNS.some((column) => column === name)
}

/** The figures whose change from the stored value raises an alert. */
export const CHANGE_FIELDS = ['close', 'value', 'avg_rate', 'rate', 'yield', 'nav'] as const
export type ChangeField = (typeof CHANGE_FIELDS)[number]

export function isChangeField(name: string): name is ChangeField {
  return CHANGE_FIELDS.some((field) => field === name)
}
