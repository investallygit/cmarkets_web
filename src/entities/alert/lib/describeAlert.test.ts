import { renderHook } from '@testing-library/react'
import i18n from 'i18next'
import { afterEach, describe, expect, it } from 'vitest'
import type { AlertCondition } from '@/shared/api/contracts'
import { useDescribeAlert } from './describeAlert'

const describeWith = (condition: AlertCondition, securityCode: string | null = null) => {
  const { result } = renderHook(() => useDescribeAlert())
  return result.current({ condition, securityCode })
}

describe('alert descriptions', () => {
  afterEach(() => i18n.changeLanguage('en'))

  it('words each type in English', async () => {
    await i18n.changeLanguage('en')
    expect(
      describeWith(
        {
          type: 'price',
          securityId: 'SEMC',
          metric: 'price',
          direction: 'above',
          threshold: 52_700,
        },
        'SEMC',
      ),
    ).toEqual({ subject: 'SEMC', condition: 'Price above 52,700' })
    expect(
      describeWith(
        {
          type: 'price',
          securityId: 'SIAT',
          metric: 'changePct',
          direction: 'below',
          threshold: -2,
        },
        'SIAT',
      ).condition,
    ).toBe('Change below -2.00%')
    expect(describeWith({ type: 'auction', country: null })).toEqual({
      subject: 'All CEMAC countries',
      condition: 'Results of a BEAC auction',
    })
    expect(
      describeWith({ type: 'publication', about: 'country', securityId: null, country: 'GQ' }),
    ).toEqual({ subject: 'Eq. Guinea', condition: 'New research on the country' })
  })

  it('names the portfolio a limit alert watches, or all of them', async () => {
    await i18n.changeLanguage('en')
    const { result } = renderHook(() => useDescribeAlert())
    const condition = { type: 'portfolio', portfolioId: 'portfolio-cemac' } as const
    expect(
      result.current({ condition, securityCode: null, portfolioName: 'CEMAC Equity Fund' }).subject,
    ).toBe('CEMAC Equity Fund')
    expect(describeWith({ type: 'portfolio', portfolioId: null }).subject).toBe(
      i18n.t('alerts.subjects.portfolios'),
    )
  })

  it('follows the language and the number format of the user', async () => {
    await i18n.changeLanguage('fr')
    expect(
      describeWith(
        {
          type: 'price',
          securityId: 'ECMR-6.25-2029',
          metric: 'price',
          direction: 'below',
          threshold: 101.5,
        },
        'ECMR 6.25% 29',
      ),
    ).toEqual({ subject: 'ECMR 6.25% 29', condition: 'Cours en dessous de 101,50' })
    expect(describeWith({ type: 'volume', securityId: 'BANGE', multiple: 2.5 }).condition).toBe(
      'Volume supérieur à 2,5× la moyenne sur 20 jours',
    )
  })
})
