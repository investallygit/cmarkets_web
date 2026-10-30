import type { AuctionDto, CalendarEventDto } from '@/shared/api/contracts'
import { isWeekend } from '@/shared/lib/isoDate'
import { businessDay } from '../lib/time'
import { auctionTitle } from './auctions'
import { BOND_FIXTURES, cashFlows } from './bonds'

type EventFixture = Omit<CalendarEventDto, 'id' | 'date'> & { inBusinessDays: number }

/**
 * Events dated from the moment the prototype starts. The first ones of the coming week are those
 * of the screen 1 mockup; held auctions and bond redemptions come from their own data.
 */
// prettier-ignore
const EVENTS: EventFixture[] = [
  { inBusinessDays: -9, type: 'meeting', title: 'SCG-RE — extraordinary general meeting', securityId: 'SCG-RE', country: 'GA' },
  { inBusinessDays: -6, type: 'dividend', title: 'SOCAPALM — dividend payment', securityId: 'SOCAPALM', country: 'CM' },
  { inBusinessDays: -3, type: 'earnings', title: 'SAFACAM — third-quarter revenue', securityId: 'SAFACAM', country: 'CM' },
  { inBusinessDays: -2, type: 'earnings', title: 'REGIONALE — half-year results', securityId: 'REGIONALE', country: 'CM' },
  { inBusinessDays: -1, type: 'earnings', title: 'SIAT — quarterly production', securityId: 'SIAT', country: 'GA' },
  { inBusinessDays: 1, type: 'auction', title: 'OTA 3 yr — Cameroon', securityId: null, country: 'CM' },
  { inBusinessDays: 2, type: 'dividend', title: 'SAFACAM — ex-dividend', securityId: 'SAFACAM', country: 'CM' },
  { inBusinessDays: 3, type: 'meeting', title: 'BANGE — AGM', securityId: 'BANGE', country: 'GQ' },
  { inBusinessDays: 4, type: 'auction', title: 'BTA 13 weeks — Gabon', securityId: null, country: 'GA' },
  { inBusinessDays: 5, type: 'session', title: 'BVMAC — new trading hours take effect', securityId: null, country: null },
  { inBusinessDays: 6, type: 'auction', title: 'BTA 26 weeks — Congo', securityId: null, country: 'CG' },
  { inBusinessDays: 7, type: 'dividend', title: 'SAFACAM — dividend payment', securityId: 'SAFACAM', country: 'CM' },
  { inBusinessDays: 8, type: 'earnings', title: 'SOCAPALM — half-year results', securityId: 'SOCAPALM', country: 'CM' },
  { inBusinessDays: 10, type: 'auction', title: 'BTA 52 weeks — Chad', securityId: null, country: 'TD' },
  { inBusinessDays: 11, type: 'meeting', title: 'SIAT — general meeting', securityId: 'SIAT', country: 'GA' },
  { inBusinessDays: 13, type: 'auction', title: 'OTA 5 yr — Gabon', securityId: null, country: 'GA' },
  { inBusinessDays: 14, type: 'dividend', title: 'BANGE — ex-dividend', securityId: 'BANGE', country: 'GQ' },
  { inBusinessDays: 16, type: 'earnings', title: 'SEMC — nine-month revenue', securityId: 'SEMC', country: 'CM' },
  { inBusinessDays: 17, type: 'auction', title: 'BTA 26 weeks — Equatorial Guinea', securityId: null, country: 'GQ' },
  { inBusinessDays: 19, type: 'meeting', title: 'SCG-RE — general meeting', securityId: 'SCG-RE', country: 'GA' },
  { inBusinessDays: 21, type: 'auction', title: 'BTA 13 weeks — Central African Republic', securityId: null, country: 'CF' },
  { inBusinessDays: 23, type: 'earnings', title: 'BANGE — nine-month results', securityId: 'BANGE', country: 'GQ' },
]

/** Scheduled events, and the auctions already held, from today's point of view. */
export function createCalendar(now: number, auctions: readonly AuctionDto[]): CalendarEventDto[] {
  const scheduled = EVENTS.map(({ inBusinessDays, ...event }, index) => ({
    ...event,
    id: `event-${index + 1}`,
    date: businessDay(inBusinessDays, now),
  }))
  const held = auctions.map((auction) => ({
    id: `event-${auction.id}`,
    date: auction.date,
    type: 'auction' as const,
    title: auctionTitle(auction),
    securityId: null,
    country: auction.country,
  }))
  return [...scheduled, ...held]
}

/** Public holidays at fixed dates in Cameroon, where BVMAC is based: no session. */
const HOLIDAYS: readonly (readonly [monthDay: string, name: string])[] = [
  ['01-01', "New Year's Day"],
  ['02-11', 'Youth Day'],
  ['05-01', 'Labour Day'],
  ['05-20', 'National Day'],
  ['08-15', 'Assumption Day'],
  ['12-25', 'Christmas Day'],
]

/** Weekdays without a session between two dates. */
export function holidayEvents(from: string, to: string): CalendarEventDto[] {
  const events: CalendarEventDto[] = []
  for (let year = Number(from.slice(0, 4)); year <= Number(to.slice(0, 4)); year++) {
    for (const [monthDay, name] of HOLIDAYS) {
      const date = `${year}-${monthDay}`
      if (date < from || date > to || isWeekend(date)) continue
      events.push({
        id: `holiday-${date}`,
        date,
        type: 'session',
        title: `BVMAC closed — ${name}`,
        securityId: null,
        country: null,
      })
    }
  }
  return events
}

/** Partial and final redemptions of the listed bonds, from their schedule. */
export function redemptionEvents(from: string, to: string): CalendarEventDto[] {
  return Object.values(BOND_FIXTURES).flatMap((bond) =>
    cashFlows(bond)
      .filter((flow) => flow.amortization > 0 && flow.date >= from && flow.date <= to)
      .map((flow) => ({
        id: `redemption-${bond.id}-${flow.date}`,
        date: flow.date,
        type: 'maturity' as const,
        title: `${flow.outstanding === 0 ? 'Final' : 'Partial'} redemption ${bond.code}`,
        securityId: bond.id,
        country: bond.country,
      })),
  )
}
