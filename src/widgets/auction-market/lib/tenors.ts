/** The tenors the BEAC auctions most: the chart's choices. */
export const AUCTION_TENORS = ['13W', '26W', '52W', '2Y', '3Y', '5Y'] as const

/** The mockup's lines: Cameroon amber, Gabon blue, Congo teal, Chad purple, then two more. */
export const LINE_TOKENS = [
  '--accent-amber',
  '--chart-1',
  '--chart-3',
  '--chart-7',
  '--chart-5',
  '--chart-6',
] as const

export const TENOR_TERMS: Record<
  (typeof AUCTION_TENORS)[number],
  { instrument: 'BTA' | 'OTA'; term: number }
> = {
  '13W': { instrument: 'BTA', term: 13 },
  '26W': { instrument: 'BTA', term: 26 },
  '52W': { instrument: 'BTA', term: 52 },
  '2Y': { instrument: 'OTA', term: 2 },
  '3Y': { instrument: 'OTA', term: 3 },
  '5Y': { instrument: 'OTA', term: 5 },
}
