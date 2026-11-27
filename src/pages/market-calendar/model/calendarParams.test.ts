import { describe, expect, it } from 'vitest'
import { DEFAULT_EVENT_TYPES } from '@/entities/calendar-event'
import { readCalendarParams, writeCalendarParams } from './calendarParams'

const TODAY = '2026-11-12'

describe('CAL parameters in the URL', () => {
  it('opens on the list from today, every type but the international, every state', () => {
    expect(readCalendarParams(new URLSearchParams(), TODAY)).toEqual({
      view: 'list',
      date: TODAY,
      types: DEFAULT_EVENT_TYPES,
      countries: [],
      mine: false,
      event: null,
    })
  })

  it('keeps only the values that differ from the defaults, and drops a country not of the CEMAC', () => {
    const state = {
      view: 'week' as const,
      date: '2026-11-16',
      types: ['auction', 'international'] as const,
      countries: ['CM', 'GA'],
      mine: true,
      event: 'result-1',
    }
    const params = writeCalendarParams(state, TODAY)
    expect(params.toString()).toBe(
      'view=week&date=2026-11-16&types=auction%2Cinternational&countries=CM%2CGA&mine=1&event=result-1',
    )
    expect(readCalendarParams(params, TODAY)).toEqual(state)
    expect(
      readCalendarParams(new URLSearchParams('countries=CM,FR&view=year'), TODAY),
    ).toMatchObject({
      view: 'list',
      countries: ['CM'],
    })
    expect(
      writeCalendarParams(readCalendarParams(new URLSearchParams(), TODAY), TODAY).toString(),
    ).toBe('')
  })
})
