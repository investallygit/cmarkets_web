import type {
  ContentReportReason,
  FrozenChartPeriod,
  FrozenChartType,
  LibrarySort,
  Outlook,
  PaymentMethod,
  PublicationDisclosures,
  Recommendation,
  SubjectType,
} from '@/shared/api/contracts'

export const LIBRARY_TABS = ['all', 'purchased', 'followed'] as const
export type LibraryTab = (typeof LIBRARY_TABS)[number]

export const LIBRARY_SORTS: readonly LibrarySort[] = ['recent', 'rating', 'reads', 'price']
/** Rows of the publication list per page. */
export const LIBRARY_PAGE_SIZE = 20

export const RECOMMENDATIONS: readonly Recommendation[] = ['buy', 'hold', 'sell']
export const OUTLOOKS: readonly Outlook[] = ['positive', 'stable', 'negative']

/** Buy / Hold / Sell on a company, an outlook on a country (spec section 13). */
export function ratingsFor(subjectType: SubjectType): readonly (Recommendation | Outlook)[] {
  return subjectType === 'company' ? RECOMMENDATIONS : OUTLOOKS
}

export const PAYMENT_METHODS: readonly PaymentMethod[] = ['mobileMoney', 'card']

export const FROZEN_CHART_PERIODS: readonly FrozenChartPeriod[] = ['1M', '3M', '6M', '1Y', '5Y']
export const FROZEN_CHART_TYPES: readonly FrozenChartType[] = ['line', 'candles']

export const CONTENT_REPORT_REASONS: readonly ContentReportReason[] = [
  'misleading',
  'conflict',
  'copyright',
  'other',
]

/** The mandatory disclosures, in the order of the screen 7 mockup. */
export const DISCLOSURES: readonly (keyof PublicationDisclosures)[] = [
  'conflicts',
  'disclaimer',
  'sources',
]
