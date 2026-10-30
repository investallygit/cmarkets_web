import { describe, expect, it } from 'vitest'
import { CALENDAR_EVENT_TYPES } from '@/entities/calendar-event'
import { readCalendarParams, writeCalendarParams } from './calendarParams'

const TODAY = '2026-10-30'

describe('CAL parameters in the URL', () => {
  it('opens on the week of today with every type and country', () => {
    expect(readCalendarParams(new URLSearchParams(), TODAY)).toEqual({
      view: 'week',
      date: TODAY,
      types: CALENDAR_EVENT_TYPES,
      country: '',
    })
  })

  it('keeps only the values that differ from the defaults', () => {
    const state = {
      view: 'day' as const,
      date: '2026-11-02',
      types: ['auction', 'dividend'] as const,
      country: 'GA',
    }
    const params = writeCalendarParams(state, TODAY)
    expect(params.toString()).toBe('view=day&date=2026-11-02&types=auction%2Cdividend&country=GA')
    expect(readCalendarParams(params, TODAY)).toEqual(state)
    expect(
      writeCalendarParams(readCalendarParams(new URLSearchParams(), TODAY), TODAY).toString(),
    ).toBe('')
  })

  it('ignores values it does not know', () => {
    const params = new URLSearchParams('view=month&date=30/10/2026&types=auction,party&country=FR')
    expect(readCalendarParams(params, TODAY)).toEqual({
      view: 'week',
      date: TODAY,
      types: ['auction'],
      country: '',
    })
  })
})
