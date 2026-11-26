import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * AUC, the screen 33 mockup (sixth version) in grid units, 12 columns x 26 rows, under the tabs
 * and the indicators:
 *
 *   latest results | average rate by country
 *   auction detail | upcoming auctions
 */
export const AUCTIONS_LAYOUT: readonly ScreenPanel[] = [
  { i: 'results', name: 'auctionResults', x: 0, y: 0, w: 7, h: 13, minW: 4, minH: 6 },
  { i: 'rates', name: 'auctionRates', x: 7, y: 0, w: 5, h: 13, minW: 3, minH: 6 },
  { i: 'detail', name: 'auctionDetail', x: 0, y: 13, w: 7, h: 13, minW: 4, minH: 6 },
  { i: 'upcoming', name: 'auctionUpcoming', x: 7, y: 13, w: 5, h: 13, minW: 3, minH: 6 },
]

/** AUC NEXT: the coming auctions, the whole width. */
export const AUCTIONS_NEXT_LAYOUT: readonly ScreenPanel[] = [
  { i: 'upcoming', name: 'auctionUpcoming', x: 0, y: 0, w: 12, h: 26, minW: 4, minH: 6 },
]

/** APE: the public bond issues, the whole width. */
export const PUBLIC_OFFERS_LAYOUT: readonly ScreenPanel[] = [
  { i: 'offers', name: 'publicOffers', x: 0, y: 0, w: 12, h: 26, minW: 4, minH: 6 },
]
