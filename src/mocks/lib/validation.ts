const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** A calendar date such as "2026-10-30", as the API exchanges them. */
export const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
