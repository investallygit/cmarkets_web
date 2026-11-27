import { renderHook } from '@testing-library/react'
import i18n from 'i18next'
import { afterEach, describe, expect, it } from 'vitest'
import type { CalendarEventDto, CalendarFactsDto } from '@/shared/api/contracts'
import { useCalendarWords } from './words'

const none: CalendarFactsDto = {
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
}

const event = (
  patch: Partial<CalendarEventDto>,
  facts: Partial<CalendarFactsDto> = {},
): CalendarEventDto => ({
  id: 'x',
  date: '2026-11-12',
  time: null,
  type: 'auction',
  title: 'server title',
  securityId: null,
  securityCode: null,
  country: 'CM',
  facts: { ...none, ...facts },
  announced: false,
  example: false,
  ...patch,
})

describe('CAL words', () => {
  afterEach(() => i18n.changeLanguage('en'))

  it('words each type from its facts, as the mockup', async () => {
    await i18n.changeLanguage('en')
    const { result } = renderHook(() => useCalendarWords())
    const words = result.current
    const auction = event(
      {},
      { instrument: 'bta', term: 26, offered: 25e9, valueDate: '2026-11-16' },
    )
    expect([words.title(auction), words.detail(auction)]).toEqual([
      'BTA 26 weeks',
      'Offered 25 bn · value 16/11',
    ])
    const result_ = event(
      { type: 'result' },
      { instrument: 'ota', term: 3, auctionDate: '2026-11-11', averageRate: 6.62, coverPct: 148 },
    )
    expect([words.title(result_), words.detail(result_)]).toEqual([
      'OTA 3 yr of 11/11',
      'Average rate 6.62% · cover 148%',
    ])
    const dividend = event({ type: 'dividend', securityCode: 'SOCAPALM' }, { phase: 'ex' })
    expect([words.title(dividend), words.detail(dividend)]).toEqual([
      'SOCAPALM · ex-dividend',
      'Amount to be confirmed',
    ])
    const beac = event({ type: 'beac', country: null, example: true }, { policyRate: 4.5 })
    expect([words.title(beac), words.detail(beac)]).toEqual([
      'Monetary Policy Committee',
      'Policy rate 4.50% (example)',
    ])
    const statistic = event(
      { type: 'statistic', title: 'Consumer price index (Oct.)', announced: true },
      { note: 'Previous 3.8% year on year' },
    )
    expect([words.title(statistic), words.detail(statistic)]).toEqual([
      'Consumer price index (Oct.)',
      'Previous 3.8% year on year · announced date',
    ])
  })

  it('words them in French', async () => {
    await i18n.changeLanguage('fr')
    const { result } = renderHook(() => useCalendarWords())
    const redemption = event(
      { type: 'redemption', securityCode: 'OTA CMR 6.00% 2021-2026' },
      { phase: 'final', amount: 150e9 },
    )
    expect([result.current.title(redemption), result.current.detail(redemption)]).toEqual([
      'OTA CMR 6.00% 2021-2026 · échéance',
      'Encours 150 Md',
    ])
  })
})
