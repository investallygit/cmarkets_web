import { describe, expect, it } from 'vitest'
import { eventForm, eventInput } from './eventForm'

describe('a calendar event entered in CORR', () => {
  it('starts as an announced statistic of today and reads its time', () => {
    const form = eventForm(null, '2026-11-12')
    expect(form).toMatchObject({ date: '2026-11-12', type: 'statistic', confirmed: false })
    expect(eventInput(form).missing).toEqual(['title'])
    expect(
      eventInput({ ...form, title: ' CPI (Oct.) ', time: '9h30', country: 'CM' }).input,
    ).toEqual({
      date: '2026-11-12',
      time: '09:30',
      type: 'statistic',
      title: 'CPI (Oct.)',
      detail: null,
      securityId: null,
      country: 'CM',
      confirmed: false,
    })
  })

  it('refuses a time that is not one and keeps an empty time as the whole day', () => {
    const form = { ...eventForm(null, '2026-11-12'), title: 'CPI' }
    expect(eventInput({ ...form, time: '25:00' }).missing).toEqual(['time'])
    expect(eventInput(form).input?.time).toBeNull()
  })
})
