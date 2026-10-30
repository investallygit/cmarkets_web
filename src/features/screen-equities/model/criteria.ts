import type {
  ScreenerCriterionDto,
  ScreenerField,
  ScreenerListField,
  ScreenerRangeField,
} from '@/shared/api/contracts'

export type RangeOperator = 'any' | 'above' | 'below' | 'between'

/** A criterion as the panel edits it: a choice in a list, or a range typed in its unit. */
export type CriterionState =
  | { field: ScreenerListField; value: string }
  | { field: ScreenerRangeField; operator: RangeOperator; min: number | null; max: number | null }

export type RangeCriterionState = Extract<CriterionState, { operator: RangeOperator }>

export type RangeUnit = 'billions' | 'multiple' | 'percent' | 'plain'

/** How each figure is typed: market cap in billions, ratios as the results show them. */
export const RANGE_FIELDS: Record<ScreenerRangeField, { unit: RangeUnit; decimals: number }> = {
  marketCap: { unit: 'billions', decimals: 1 },
  pe: { unit: 'multiple', decimals: 1 },
  dividendYield: { unit: 'percent', decimals: 1 },
  roe: { unit: 'percent', decimals: 1 },
  netDebtToEquity: { unit: 'multiple', decimals: 1 },
  change1y: { unit: 'percent', decimals: 1 },
  priceToBook: { unit: 'multiple', decimals: 2 },
  netMargin: { unit: 'percent', decimals: 1 },
  revenueGrowth: { unit: 'percent', decimals: 1 },
  beta: { unit: 'plain', decimals: 2 },
}

const LIST_FIELDS: readonly ScreenerListField[] = ['market', 'country', 'sector']

/** The nine criteria of the screen 3 mockup, always shown. */
export const BASE_FIELDS: readonly ScreenerField[] = [
  'market',
  'country',
  'sector',
  'marketCap',
  'pe',
  'dividendYield',
  'roe',
  'netDebtToEquity',
  'change1y',
]

/** Offered by "+ Add a criterion". */
export const EXTRA_FIELDS: readonly ScreenerRangeField[] = [
  'priceToBook',
  'netMargin',
  'revenueGrowth',
  'beta',
]

export const DEFAULT_MARKET = 'BVMAC'

const BILLION = 1e9

export function isListField(field: ScreenerField): field is ScreenerListField {
  return LIST_FIELDS.some((candidate) => candidate === field)
}

export function emptyCriterion(field: ScreenerField): CriterionState {
  return isListField(field)
    ? { field, value: '' }
    : { field, operator: 'any', min: null, max: null }
}

/** What EQS opens with: every equity of BVMAC. */
export function defaultCriteria(): CriterionState[] {
  return BASE_FIELDS.map((field) =>
    field === 'market' ? { field, value: DEFAULT_MARKET } : emptyCriterion(field),
  )
}

/** The minimum is above the maximum. Missing bounds are not an error: the criterion is left out. */
export function hasInvertedBounds(criterion: CriterionState): boolean {
  return (
    'operator' in criterion &&
    criterion.operator === 'between' &&
    criterion.min !== null &&
    criterion.max !== null &&
    criterion.min > criterion.max
  )
}

/** Filters the results: amber border (spec section 9, screen 3). The market sets the universe. */
export function isActive(criterion: CriterionState): boolean {
  if (!('operator' in criterion)) return criterion.field !== 'market' && criterion.value !== ''
  const { operator, min, max } = criterion
  if (hasInvertedBounds(criterion)) return false
  return (
    (operator === 'above' && min !== null) ||
    (operator === 'below' && max !== null) ||
    (operator === 'between' && min !== null && max !== null)
  )
}

/** The criteria sent to POST /analysis/screener; incomplete ranges are left out. */
export function toRequestCriteria(criteria: readonly CriterionState[]): ScreenerCriterionDto[] {
  return criteria.flatMap((criterion): ScreenerCriterionDto[] => {
    if (!('operator' in criterion)) {
      return criterion.value === '' ? [] : [{ field: criterion.field, values: [criterion.value] }]
    }
    if (!isActive(criterion)) return []
    const scale = RANGE_FIELDS[criterion.field].unit === 'billions' ? BILLION : 1
    const bound = (value: number | null) => (value === null ? null : value * scale)
    return [
      {
        field: criterion.field,
        min: criterion.operator === 'below' ? null : bound(criterion.min),
        max: criterion.operator === 'above' ? null : bound(criterion.max),
      },
    ]
  })
}

/** A saved screen back in the panel: the nine base criteria, then the others it uses. */
export function fromRequestCriteria(saved: readonly ScreenerCriterionDto[]): CriterionState[] {
  const fields = [
    ...BASE_FIELDS,
    ...EXTRA_FIELDS.filter((field) => saved.some((criterion) => criterion.field === field)),
  ]
  return fields.map((field): CriterionState => {
    const found = saved.find((criterion) => criterion.field === field)
    if (!found) return emptyCriterion(field)
    if ('values' in found) return { field: found.field, value: found.values.at(0) ?? '' }
    const scale = RANGE_FIELDS[found.field].unit === 'billions' ? BILLION : 1
    const { min, max } = found
    const operator: RangeOperator =
      min !== null && max !== null
        ? 'between'
        : min !== null
          ? 'above'
          : max !== null
            ? 'below'
            : 'any'
    return {
      field: found.field,
      operator,
      min: min === null ? null : min / scale,
      max: max === null ? null : max / scale,
    }
  })
}
