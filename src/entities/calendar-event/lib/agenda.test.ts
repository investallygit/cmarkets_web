import { describe, expect, it } from 'vitest'
import type { CalendarEventDto } from '@/shared/api/contracts'
import { groupByDay, rangeOf, stepOf } from './agenda'

const event = (id: string, date: string, time: string | null = null): CalendarEventDto => ({
  id,
  date,
  time,
  type: 'auction',
  title: id,
  securityId: null,
  securityCode: null,
  country: 'CM',
  facts: {
    instrument: null,
    term: null,
    phase: null,
    offered: null,
    valueDate: null,
    maturity: null,
    auctionDate: null,
    averageRate: null,
    coverPct: null,
    amount: null,
    currency: null,
    policyRate: null,
    note: null,
  },
  announced: false,
  example: false,
})

describe('the agenda by day', () => {
  it('keeps the server order within a day and adds the days with only a note', () => {
    const days = groupByDay(
      [event('a', '2026-11-12', '10:00'), event('b', '2026-11-12'), event('c', '2026-11-16')],
      [{ date: '2026-11-14', text: 'BVMAC closed', closed: true }],
    )
    expect(
      days.map((day) => [day.date, day.events.map((item) => item.id), day.notes.length]),
    ).toEqual([
      ['2026-11-12', ['a', 'b'], 0],
      ['2026-11-14', [], 1],
      ['2026-11-16', ['c'], 0],
    ])
  })

  it('shows a day, a week from Monday, two weeks from the day or a calendar month', () => {
    expect(rangeOf('day', '2026-11-12')).toEqual({ from: '2026-11-12', to: '2026-11-12' })
    expect(rangeOf('week', '2026-11-12')).toEqual({ from: '2026-11-09', to: '2026-11-15' })
    expect(rangeOf('list', '2026-11-12')).toEqual({ from: '2026-11-12', to: '2026-11-25' })
    expect(rangeOf('month', '2026-11-12')).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(stepOf('month', '2026-11-12', 1)).toBe('2026-12-01')
    expect(stepOf('list', '2026-11-12', -1)).toBe('2026-10-29')
  })
})
