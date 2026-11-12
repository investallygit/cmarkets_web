import type { SecurityType } from '@/shared/api/contracts'
import type { SecurityFunction } from '@/shared/routes/paths'
import type { ScreenPanel } from '@/features/workspace-layout'

type Layouts = Partial<Record<SecurityFunction, readonly ScreenPanel[]>>

/**
 * Default panels of each tab of an equity's profile and of the tabs every profile shares (N, DOC,
 * ANA), in grid units (12 columns x 26 rows). The DES tab follows the screen 2 mockup (spec
 * section 9):
 *
 *   chart    chart    | orderbook
 *   chart    chart    | trades
 *   keydata | income  | documents
 *
 * "income" holds the dividends. FA shows the comparison and the statements of the screen 3
 * mockup, with the ratios and the price chart.
 */
// prettier-ignore
const PROFILE_LAYOUTS: Layouts = {
  des: [
    { i: 'chart', name: 'priceChart', x: 0, y: 0, w: 8, h: 16, minW: 4, minH: 8 },
    { i: 'orderbook', name: 'orderBook', x: 8, y: 0, w: 4, h: 8, minW: 3, minH: 5 },
    { i: 'trades', name: 'latestTrades', x: 8, y: 8, w: 4, h: 8, minW: 3, minH: 4 },
    { i: 'keydata', name: 'keyData', x: 0, y: 16, w: 4, h: 10, minW: 3, minH: 5 },
    { i: 'income', name: 'securityIncome', x: 4, y: 16, w: 4, h: 10, minW: 3, minH: 4 },
    { i: 'documents', name: 'documentsNews', x: 8, y: 16, w: 4, h: 10, minW: 3, minH: 4 },
  ],
  gp: [{ i: 'chart', name: 'priceChart', x: 0, y: 0, w: 12, h: 26, minW: 6, minH: 10 }],
  fa: [
    { i: 'comparison', name: 'comparison', x: 0, y: 0, w: 4, h: 15, minW: 3, minH: 8 },
    { i: 'ratios', name: 'ratios', x: 0, y: 15, w: 4, h: 11, minW: 3, minH: 6 },
    { i: 'statements', name: 'statements', x: 4, y: 0, w: 8, h: 10, minW: 4, minH: 6 },
    { i: 'summary', name: 'financialSummary', x: 4, y: 10, w: 8, h: 6, minW: 4, minH: 4 },
    { i: 'chart', name: 'priceChart', x: 4, y: 16, w: 8, h: 10, minW: 4, minH: 8 },
  ],
  dvd: [
    { i: 'dividends', name: 'dividends', x: 0, y: 0, w: 8, h: 11, minW: 4, minH: 4 },
    { i: 'keydata', name: 'keyData', x: 8, y: 0, w: 4, h: 11, minW: 3, minH: 5 },
    { i: 'chart', name: 'priceChart', x: 0, y: 11, w: 12, h: 15, minW: 4, minH: 8 },
  ],
  n: [
    { i: 'list', name: 'securityNews', x: 0, y: 0, w: 5, h: 26, minW: 3, minH: 6 },
    { i: 'article', name: 'article', x: 5, y: 0, w: 7, h: 26, minW: 3, minH: 6 },
  ],
  doc: [
    { i: 'list', name: 'documents', x: 0, y: 0, w: 5, h: 26, minW: 3, minH: 6 },
    { i: 'viewer', name: 'document', x: 5, y: 0, w: 7, h: 26, minW: 4, minH: 10 },
  ],
  hds: [
    { i: 'shareholders', name: 'shareholders', x: 0, y: 0, w: 7, h: 11, minW: 4, minH: 4 },
    { i: 'keydata', name: 'keyData', x: 7, y: 0, w: 5, h: 11, minW: 3, minH: 5 },
    { i: 'chart', name: 'priceChart', x: 0, y: 11, w: 12, h: 15, minW: 4, minH: 8 },
  ],
  ana: [
    { i: 'list', name: 'publications', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
    { i: 'preview', name: 'preview', x: 7, y: 0, w: 5, h: 17, minW: 3, minH: 8 },
    { i: 'analyst', name: 'analyst', x: 7, y: 17, w: 5, h: 9, minW: 3, minH: 5 },
  ],
}

/**
 * A bond's tabs (screen 20 mockup). DES:
 *
 *   history  history  | analytics
 *   history  history  | ratings
 *   characteristics | cash flows | documents
 *
 * GP, the history alone; BP, the panels of screen 16; CF, the whole schedule beside the payments to
 * come and the characteristics; RAT, the ratings in force, the day's figures and the ratings given.
 */
// prettier-ignore
const BOND_LAYOUTS: Layouts = {
  des: [
    { i: 'history', name: 'priceYieldHistory', x: 0, y: 0, w: 8, h: 15, minW: 4, minH: 8 },
    { i: 'analytics', name: 'todaysAnalytics', x: 8, y: 0, w: 4, h: 9, minW: 3, minH: 5 },
    { i: 'ratings', name: 'bondRatings', x: 8, y: 9, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'characteristics', name: 'bondCharacteristics', x: 0, y: 15, w: 4, h: 11, minW: 3, minH: 5 },
    { i: 'cashFlows', name: 'upcomingCashFlows', x: 4, y: 15, w: 4, h: 11, minW: 3, minH: 5 },
    { i: 'documents', name: 'documentsNews', x: 8, y: 15, w: 4, h: 11, minW: 3, minH: 4 },
  ],
  gp: [{ i: 'history', name: 'priceYieldHistory', x: 0, y: 0, w: 12, h: 26, minW: 6, minH: 10 }],
  bp: [
    { i: 'inputs', name: 'bondPricingInputs', x: 0, y: 0, w: 3, h: 26, minW: 2, minH: 10 },
    { i: 'results', name: 'bondPricingResults', x: 3, y: 0, w: 6, h: 9, minW: 3, minH: 5 },
    { i: 'cashFlows', name: 'cashFlowSchedule', x: 3, y: 9, w: 6, h: 17, minW: 3, minH: 5 },
    { i: 'priceYield', name: 'priceYield', x: 9, y: 0, w: 3, h: 13, minW: 2, minH: 6 },
    { i: 'sensitivity', name: 'rateSensitivity', x: 9, y: 13, w: 3, h: 13, minW: 2, minH: 6 },
  ],
  cf: [
    { i: 'schedule', name: 'cashFlowSchedule', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 6 },
    { i: 'cashFlows', name: 'upcomingCashFlows', x: 7, y: 0, w: 5, h: 13, minW: 3, minH: 5 },
    { i: 'characteristics', name: 'bondCharacteristics', x: 7, y: 13, w: 5, h: 13, minW: 3, minH: 5 },
  ],
  rat: [
    { i: 'ratings', name: 'bondRatings', x: 0, y: 0, w: 4, h: 9, minW: 3, minH: 4 },
    { i: 'analytics', name: 'todaysAnalytics', x: 0, y: 9, w: 4, h: 17, minW: 3, minH: 5 },
    { i: 'history', name: 'ratingHistory', x: 4, y: 0, w: 8, h: 26, minW: 4, minH: 6 },
  ],
}

/**
 * An ETF's tabs (screen 19 mockup). DES:
 *
 *   history  history  | performance
 *   history  history  | risk
 *   holdings | allocation | structure
 *
 * GP, the price chart alone; HLD, every line beside the sectors and the regions; PERF, the total
 * return against the index over the calendar years, beside every period and the risk; DIST, the
 * distributions beside the fund's policy.
 */
// prettier-ignore
const ETF_LAYOUTS: Layouts = {
  des: [
    { i: 'history', name: 'etfPriceHistory', x: 0, y: 0, w: 8, h: 16, minW: 4, minH: 8 },
    { i: 'performance', name: 'etfPerformance', x: 8, y: 0, w: 4, h: 9, minW: 3, minH: 5 },
    { i: 'risk', name: 'etfRisk', x: 8, y: 9, w: 4, h: 7, minW: 3, minH: 4 },
    { i: 'holdings', name: 'etfTopHoldings', x: 0, y: 16, w: 4, h: 10, minW: 3, minH: 5 },
    { i: 'allocation', name: 'etfAllocation', x: 4, y: 16, w: 4, h: 10, minW: 3, minH: 5 },
    { i: 'structure', name: 'etfStructure', x: 8, y: 16, w: 4, h: 10, minW: 3, minH: 5 },
  ],
  gp: [{ i: 'chart', name: 'priceChart', x: 0, y: 0, w: 12, h: 26, minW: 6, minH: 10 }],
  hld: [
    { i: 'holdings', name: 'etfHoldings', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 6 },
    { i: 'sectors', name: 'etfSectors', x: 7, y: 0, w: 5, h: 13, minW: 3, minH: 5 },
    { i: 'regions', name: 'etfRegions', x: 7, y: 13, w: 5, h: 13, minW: 3, minH: 5 },
  ],
  perf: [
    { i: 'growth', name: 'etfGrowth', x: 0, y: 0, w: 8, h: 15, minW: 4, minH: 8 },
    { i: 'performance', name: 'etfPerformance', x: 8, y: 0, w: 4, h: 13, minW: 3, minH: 6 },
    { i: 'annual', name: 'etfAnnualReturns', x: 0, y: 15, w: 8, h: 11, minW: 4, minH: 5 },
    { i: 'risk', name: 'etfRisk', x: 8, y: 13, w: 4, h: 13, minW: 3, minH: 4 },
  ],
  dist: [
    { i: 'distributions', name: 'etfDistributions', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 6 },
    { i: 'policy', name: 'etfDistributionPolicy', x: 7, y: 0, w: 5, h: 26, minW: 3, minH: 6 },
  ],
}

/** The tabs every profile shows alike, which keep one layout across types. */
const SHARED_TABS: ReadonlySet<SecurityFunction> = new Set(['n', 'doc', 'ana'])

/** The profiles with tabs of their own, each with its layouts and the prefix of their keys. */
const OWN_LAYOUTS: Partial<Record<SecurityType, { prefix: string; layouts: Layouts }>> = {
  bond: { prefix: 'BOND', layouts: BOND_LAYOUTS },
  etf: { prefix: 'ETF', layouts: ETF_LAYOUTS },
}

const ownLayouts = (fn: SecurityFunction, type: SecurityType) =>
  SHARED_TABS.has(fn) ? undefined : OWN_LAYOUTS[type]

/** The default panels of a tab in the profile of the type. */
export function defaultLayout(fn: SecurityFunction, type: SecurityType): readonly ScreenPanel[] {
  return (ownLayouts(fn, type)?.layouts ?? PROFILE_LAYOUTS)[fn] ?? []
}

/**
 * Layout key of a tab for /me/layouts/{screen}: DES, DES-GP, DES-DVD... for an equity and the
 * shared tabs; BOND, BOND-GP, BOND-CF... for a bond's own; ETF, ETF-GP, ETF-HLD... for an ETF's.
 */
export function layoutKey(fn: SecurityFunction, type: SecurityType): string {
  const prefix = ownLayouts(fn, type)?.prefix ?? 'DES'
  return fn === 'des' ? prefix : `${prefix}-${fn.toUpperCase()}`
}
