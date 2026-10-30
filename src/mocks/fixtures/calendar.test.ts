import { describe, expect, it } from 'vitest'
import { isWeekend } from '@/shared/lib/isoDate'
import { businessDay } from '../lib/time'
import { createAuctions } from './auctions'
import { createCalendar, holidayEvents, redemptionEvents } from './calendar'

// Friday 30/10/2026, 10:00 in Douala.
const NOW = Date.parse('2026-10-30T09:00:00Z')

describe('mock calendar', () => {
  it('counts business days from today, a weekend counting as the Friday before', () => {
    expect(businessDay(1, NOW)).toBe('2026-11-02')
    expect(businessDay(-5, NOW)).toBe('2026-10-23')
    expect(businessDay(0, Date.parse('2026-11-01T09:00:00Z'))).toBe('2026-10-30')
  })

  it('dates every event on a weekday', () => {
    const events = createCalendar(NOW, createAuctions(NOW))
    expect(events.filter((event) => isWeekend(event.date))).toEqual([])
    // The held auctions of the screen 4 mockup are in the calendar too.
    expect(events).toContainEqual(
      expect.objectContaining({ date: '2026-10-30', title: 'BTA 26 weeks — Cameroon' }),
    )
  })

  it('closes BVMAC on the fixed public holidays that fall on a weekday', () => {
    expect(holidayEvents('2026-12-01', '2027-01-31').map((event) => event.date)).toEqual([
      '2026-12-25',
      '2027-01-01',
    ])
    // 25/12/2027 is a Saturday.
    expect(holidayEvents('2027-12-01', '2027-12-31')).toEqual([])
  })

  it('takes bond redemptions from their schedule', () => {
    expect(redemptionEvents('2026-10-30', '2026-11-30')).toEqual([
      expect.objectContaining({
        date: '2026-11-04',
        type: 'maturity',
        title: 'Partial redemption ECMR 6.25% 29',
        securityId: 'ECMR-6.25-2029',
      }),
    ])
    expect(redemptionEvents('2028-06-01', '2028-06-30')[0]?.title).toBe(
      'Final redemption GAB 6.50% 28',
    )
  })
})
