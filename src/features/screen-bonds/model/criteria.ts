import type {
  BondIssuerCategory,
  BondMarket,
  BondScreenCriteriaDto,
  BondScreenerQuery,
  CouponType,
} from '@/shared/api/contracts'
import { BOND_MARKETS } from '@/shared/api/contracts'

/**
 * The issue category boxes of the screen 17 mockup and the bond list's categories each one
 * covers ("Supranational / regional"); Municipal, which the mockup's boxes leave out, after them.
 */
export const CATEGORY_GROUPS = {
  sovereign: ['sovereign'],
  supranational: ['supranational', 'regional'],
  corporate: ['corporate'],
  municipal: ['municipal'],
} as const satisfies Record<string, readonly BondIssuerCategory[]>
export type CategoryGroup = keyof typeof CATEGORY_GROUPS
export const CATEGORY_GROUP_KEYS = Object.keys(CATEGORY_GROUPS) as CategoryGroup[]

/** The panel's criteria: the boxes ticked, then each figure, null for "All". */
export interface BondCriteria {
  categories: CategoryGroup[]
  markets: BondMarket[]
  /** Yields above it, in percent. */
  ytmMin: number | null
  durationMin: number | null
  durationMax: number | null
  /** Years, both included. */
  maturityFrom: number | null
  maturityTo: number | null
  country: string | null
  currency: string | null
  /** The composite rating or better, on S&P's scale. */
  ratingMin: string | null
  couponType: CouponType | null
}

/** The choices of the drop-downs (the mockup's "> 5.00%", "between 0 and 5", "2026 – 2032"). */
export const YTM_CHOICES = [3, 4, 5, 6, 7, 8] as const
export const DURATION_CHOICES: readonly (readonly [number, number | null])[] = [
  [0, 2],
  [0, 5],
  [2, 5],
  [5, 10],
  [10, null],
]
export const RATING_CHOICES = ['AAA', 'AA-', 'A-', 'BBB-', 'BB-', 'B-', 'CCC-'] as const

/** The maturities from this year: up to 2, 6 and 10 years on, and beyond. */
export function maturityChoices(year: number): (readonly [number, number | null])[] {
  return [
    [year, year + 2],
    [year, year + 6],
    [year, year + 10],
    [year + 11, null],
  ]
}

/**
 * The screen of the mockup: every category and market, yields above 5%, a modified duration
 * between 0 and 5, maturities from this year to six years on, in XAF.
 */
export function defaultCriteria(year: number): BondCriteria {
  return {
    categories: [...CATEGORY_GROUP_KEYS],
    markets: [...BOND_MARKETS],
    ytmMin: 5,
    durationMin: 0,
    durationMax: 5,
    maturityFrom: year,
    maturityTo: year + 6,
    country: null,
    currency: 'XAF',
    ratingMin: null,
    couponType: null,
  }
}

/** A screen keeps some bonds only with a category and a market ticked. */
export function isRunnable(criteria: BondCriteria): boolean {
  return criteria.categories.length > 0 && criteria.markets.length > 0
}

const categoriesOf = (groups: readonly CategoryGroup[]): BondIssuerCategory[] =>
  groups.length === CATEGORY_GROUP_KEYS.length
    ? []
    : CATEGORY_GROUP_KEYS.filter((group) => groups.includes(group)).flatMap(
        (group) => CATEGORY_GROUPS[group],
      )

const marketsOf = (markets: readonly BondMarket[]): BondMarket[] =>
  markets.length === BOND_MARKETS.length
    ? []
    : BOND_MARKETS.filter((market) => markets.includes(market))

/** GET /bonds/screener's query: the lists only when a box is unticked, every bond on one page. */
export function toQuery(criteria: BondCriteria): BondScreenerQuery {
  const categories = categoriesOf(criteria.categories)
  const markets = marketsOf(criteria.markets)
  const query: BondScreenerQuery = { pageSize: 200 }
  if (categories.length > 0) query.issuerCategory = categories.join(',')
  if (markets.length > 0) query.market = markets.join(',')
  if (criteria.ytmMin !== null) query.ytmMin = criteria.ytmMin
  if (criteria.durationMin !== null) query.durationMin = criteria.durationMin
  if (criteria.durationMax !== null) query.durationMax = criteria.durationMax
  if (criteria.maturityFrom !== null) query.maturityFrom = `${criteria.maturityFrom}-01-01`
  if (criteria.maturityTo !== null) query.maturityTo = `${criteria.maturityTo}-12-31`
  if (criteria.country) query.country = criteria.country
  if (criteria.currency) query.currency = criteria.currency
  if (criteria.ratingMin) query.ratingMin = criteria.ratingMin
  if (criteria.couponType) query.couponType = criteria.couponType
  return query
}

/** The criteria as a saved screen keeps them (POST /analysis/bond-screens). */
export function toSaved(criteria: BondCriteria): BondScreenCriteriaDto {
  return {
    issuerCategories: categoriesOf(criteria.categories),
    markets: marketsOf(criteria.markets),
    ytmMin: criteria.ytmMin,
    durationMin: criteria.durationMin,
    durationMax: criteria.durationMax,
    maturityFrom: criteria.maturityFrom === null ? null : `${criteria.maturityFrom}-01-01`,
    maturityTo: criteria.maturityTo === null ? null : `${criteria.maturityTo}-12-31`,
    country: criteria.country,
    currency: criteria.currency,
    ratingMin: criteria.ratingMin,
    couponType: criteria.couponType,
    status: null,
  }
}

const yearOf = (date: string | null) => (date ? Number(date.slice(0, 4)) : null)

/** A saved screen back in the panel: a box ticked when it covers a category kept, all when none. */
export function fromSaved(saved: BondScreenCriteriaDto): BondCriteria {
  return {
    categories:
      saved.issuerCategories.length === 0
        ? [...CATEGORY_GROUP_KEYS]
        : CATEGORY_GROUP_KEYS.filter((group) =>
            CATEGORY_GROUPS[group].some((category) => saved.issuerCategories.includes(category)),
          ),
    markets: saved.markets.length === 0 ? [...BOND_MARKETS] : [...saved.markets],
    ytmMin: saved.ytmMin,
    durationMin: saved.durationMin,
    durationMax: saved.durationMax,
    maturityFrom: yearOf(saved.maturityFrom),
    maturityTo: yearOf(saved.maturityTo),
    country: saved.country,
    currency: saved.currency,
    ratingMin: saved.ratingMin,
    couponType: saved.couponType,
  }
}

/** A pair of bounds as a drop-down's value: "0:5", "10:" for 10 and above, "" for all. */
export function rangeValue(min: number | null, max: number | null): string {
  return min === null && max === null ? '' : `${min ?? ''}:${max ?? ''}`
}

export function readRange(value: string): [number | null, number | null] {
  if (value === '') return [null, null]
  const [min = '', max = ''] = value.split(':')
  return [min === '' ? null : Number(min), max === '' ? null : Number(max)]
}
