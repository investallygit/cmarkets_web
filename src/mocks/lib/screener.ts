import type {
  ScreenerCriterionDto,
  ScreenerField,
  ScreenerListField,
  ScreenerRangeField,
} from '@/shared/api/contracts'

const LIST_FIELDS: readonly ScreenerListField[] = ['market', 'country', 'sector']
const RANGE_FIELDS: readonly ScreenerRangeField[] = [
  'marketCap',
  'pe',
  'dividendYield',
  'roe',
  'netDebtToEquity',
  'change1y',
  'priceToBook',
  'netMargin',
  'revenueGrowth',
  'beta',
]

/** What the criteria are tested against: a security's text fields and figures. */
export type ScreenerValues = Record<ScreenerField, string | number | null>

export function meetsCriterion(values: ScreenerValues, criterion: ScreenerCriterionDto): boolean {
  const value = values[criterion.field]
  if ('values' in criterion) return criterion.values.includes(String(value))
  if (typeof value !== 'number') return false
  return (
    (criterion.min === null || value >= criterion.min) &&
    (criterion.max === null || value <= criterion.max)
  )
}

const isBound = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value))

/** The criteria of a request body, or the errors by criterion, as FluentValidation reports them. */
export function readCriteria(
  value: unknown,
): { criteria: ScreenerCriterionDto[] } | { errors: Record<string, string[]> } {
  if (!Array.isArray(value)) return { errors: { criteria: ['A list of criteria is required.'] } }
  const errors: Record<string, string[]> = {}
  const criteria = value.flatMap((item: unknown, index): ScreenerCriterionDto[] => {
    const criterion = (item ?? {}) as Record<string, unknown>
    const field = LIST_FIELDS.find((candidate) => candidate === criterion.field)
    const rangeField = RANGE_FIELDS.find((candidate) => candidate === criterion.field)
    const values = criterion.values
    if (field && Array.isArray(values) && values.every((entry) => typeof entry === 'string')) {
      return [{ field, values }]
    }
    if (rangeField && isBound(criterion.min) && isBound(criterion.max)) {
      const { min, max } = criterion
      if (min === null || max === null || min <= max) return [{ field: rangeField, min, max }]
      errors[`criteria[${index}]`] = ['The minimum is above the maximum.']
      return []
    }
    errors[`criteria[${index}]`] = [`Unknown or incomplete criterion ${String(criterion.field)}.`]
    return []
  })
  return Object.keys(errors).length > 0 ? { errors } : { criteria }
}
