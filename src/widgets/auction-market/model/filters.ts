import type { AuctionInstrument } from '@/shared/api/contracts'

/** AUC's filters (screen 33): a state or all, BTA or OTA or both, a year. */
export interface AuctionFilters {
  country: string
  type: '' | AuctionInstrument
  year: number
}

/** The years the period offers: this one and the two before, as far back as the demo's history. */
export function auctionYears(current: number): number[] {
  return [current, current - 1, current - 2]
}

/** The first and last days of a year, as the results' query takes them. */
export function yearSpan(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}
