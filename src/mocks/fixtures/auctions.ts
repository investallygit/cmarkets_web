import type { AuctionDto } from '@/shared/api/contracts'
import { addDays } from '@/shared/lib/isoDate'
import { businessDay } from '../lib/time'

/** Country names as the server words its titles ("BTA 13 weeks — Gabon"). */
export const COUNTRY_NAMES: Record<string, string> = {
  CM: 'Cameroon',
  GA: 'Gabon',
  CG: 'Congo',
  TD: 'Chad',
  CF: 'Central African Republic',
  GQ: 'Equatorial Guinea',
}

type AuctionFixture = Omit<AuctionDto, 'id' | 'date' | 'maturityDate' | 'coverRatio'> & {
  businessDaysAgo: number
}

/**
 * The auctions of the screen 4 mockup, newest first. The 26-week Cameroon BTA at 4.95% is also
 * the yield conversion example of spec section 14.
 */
// prettier-ignore
const AUCTIONS: AuctionFixture[] = [
  { businessDaysAgo: 0, country: 'CM', instrument: 'BTA', term: 26, amountOffered: 15_000, amountBid: 24_300, amountAllotted: 15_000, averageRate: 4.95, marginalRate: 5.05 },
  { businessDaysAgo: 1, country: 'GA', instrument: 'OTA', term: 3, amountOffered: 30_000, amountBid: 27_500, amountAllotted: 25_800, averageRate: 6.8, marginalRate: 6.9 },
  { businessDaysAgo: 4, country: 'CG', instrument: 'BTA', term: 13, amountOffered: 10_000, amountBid: 14_800, amountAllotted: 10_000, averageRate: 6.15, marginalRate: 6.3 },
  { businessDaysAgo: 5, country: 'TD', instrument: 'BTA', term: 52, amountOffered: 12_000, amountBid: 16_900, amountAllotted: 12_000, averageRate: 6.4, marginalRate: 6.55 },
  { businessDaysAgo: 5, country: 'CM', instrument: 'OTA', term: 5, amountOffered: 40_000, amountBid: 52_100, amountAllotted: 40_000, averageRate: 6.6, marginalRate: 6.7 },
  { businessDaysAgo: 9, country: 'GQ', instrument: 'BTA', term: 26, amountOffered: 8_000, amountBid: 9_600, amountAllotted: 8_000, averageRate: 5.6, marginalRate: 5.75 },
  { businessDaysAgo: 10, country: 'CF', instrument: 'BTA', term: 13, amountOffered: 5_000, amountBid: 4_100, amountAllotted: 3_900, averageRate: 6.05, marginalRate: 6.2 },
  { businessDaysAgo: 14, country: 'GA', instrument: 'BTA', term: 52, amountOffered: 20_000, amountBid: 31_200, amountAllotted: 20_000, averageRate: 5.9, marginalRate: 6.0 },
  { businessDaysAgo: 15, country: 'CM', instrument: 'BTA', term: 13, amountOffered: 15_000, amountBid: 26_700, amountAllotted: 15_000, averageRate: 4.62, marginalRate: 4.7 },
]

function maturityOf(date: string, instrument: AuctionDto['instrument'], term: number): string {
  if (instrument === 'BTA') return addDays(date, term * 7)
  return `${Number(date.slice(0, 4)) + term}${date.slice(4)}`
}

export function createAuctions(now: number): AuctionDto[] {
  return AUCTIONS.map(({ businessDaysAgo, ...auction }, index) => {
    const date = businessDay(-businessDaysAgo, now)
    return {
      ...auction,
      id: `auction-${index + 1}`,
      date,
      maturityDate: maturityOf(date, auction.instrument, auction.term),
      coverRatio: Number((auction.amountBid / auction.amountOffered).toFixed(2)),
    }
  })
}

/** "BTA 13 weeks — Gabon", "OTA 3 yr — Cameroon", as in the calendar of the screen 1 mockup. */
export function auctionTitle({
  instrument,
  term,
  country,
}: Pick<AuctionDto, 'instrument' | 'term' | 'country'>) {
  const unit = instrument === 'BTA' ? 'weeks' : 'yr'
  return `${instrument} ${term} ${unit} — ${COUNTRY_NAMES[country] ?? country}`
}
