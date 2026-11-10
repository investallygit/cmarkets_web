import { describe, expect, it } from 'vitest'
import type { AlertDto } from '@/shared/api/contracts'
import { initialAlertForm, toAlertInput, validateAlertForm } from './alertForm'

const semc = { id: 'SEMC', code: 'SEMC' }

describe('alert form', () => {
  it('starts as a price alert on the security of the right-click menu', () => {
    const form = initialAlertForm(undefined, semc)
    expect(form).toMatchObject({ type: 'price', security: semc, channels: ['push'], enabled: true })
    expect(validateAlertForm(form)).toEqual({ threshold: 'required' })
  })

  it('asks for what each type needs', () => {
    const form = initialAlertForm()
    expect(validateAlertForm({ ...form, threshold: -5 })).toEqual({
      security: 'required',
      threshold: 'positive',
    })
    // A fall in percent is a negative threshold.
    expect(
      validateAlertForm({ ...form, security: semc, metric: 'changePct', threshold: -2 }),
    ).toEqual({})
    expect(validateAlertForm({ ...form, type: 'volume', security: semc, multiple: 1 })).toEqual({
      multiple: 'aboveOne',
    })
    expect(validateAlertForm({ ...form, type: 'auction', channels: [] })).toEqual({
      channels: 'required',
    })
    expect(validateAlertForm({ ...form, type: 'publication', about: 'country' })).toEqual({
      country: 'required',
    })
    expect(validateAlertForm({ ...form, type: 'publication', about: 'analysts' })).toEqual({})
  })

  it('sends only the fields of the chosen type', () => {
    const form = { ...initialAlertForm(undefined, semc), threshold: 52_700 }
    expect(toAlertInput({ ...form, channels: ['sms', 'push'] })).toEqual({
      condition: {
        type: 'price',
        securityId: 'SEMC',
        metric: 'price',
        direction: 'above',
        threshold: 52_700,
      },
      channels: ['push', 'sms'],
      enabled: true,
    })
    expect(toAlertInput({ ...form, type: 'portfolio' }).condition).toEqual({
      type: 'portfolio',
      portfolioId: null,
    })
    expect(
      toAlertInput({ ...form, type: 'portfolio', portfolioId: 'portfolio-cemac' }).condition,
    ).toEqual({ type: 'portfolio', portfolioId: 'portfolio-cemac' })
    expect(toAlertInput({ ...form, type: 'auction', country: '' }).condition).toEqual({
      type: 'auction',
      country: null,
    })
    expect(toAlertInput({ ...form, type: 'publication', about: 'security' }).condition).toEqual({
      type: 'publication',
      about: 'security',
      securityId: 'SEMC',
      country: null,
    })
  })

  it('follows the news of a security or of a country (ROADMAP decision 5)', () => {
    const form = initialAlertForm(undefined, semc)
    const onSecurity = { ...form, type: 'release' as const }
    const onCountry = { ...onSecurity, newsAbout: 'country' as const }

    expect(validateAlertForm({ ...onSecurity, security: null })).toEqual({ security: 'required' })
    expect(validateAlertForm(onCountry)).toEqual({ country: 'required' })
    expect(toAlertInput(onSecurity).condition).toEqual({
      type: 'release',
      securityId: 'SEMC',
      country: null,
    })
    expect(toAlertInput({ ...onCountry, country: 'GA' }).condition).toEqual({
      type: 'release',
      securityId: null,
      country: 'GA',
    })
    const opened = initialAlertForm({
      id: 'alert-news',
      condition: { type: 'release', securityId: null, country: 'CM' },
      channels: ['push'],
      enabled: true,
      securityCode: null,
      portfolioName: null,
      createdAt: '2026-11-10T08:00:00Z',
      lastTriggeredAt: null,
    })
    expect(opened).toMatchObject({ type: 'release', newsAbout: 'country', country: 'CM' })
  })

  it('opens an existing alert with its values', () => {
    const alert: AlertDto = {
      id: 'alert-2',
      condition: { type: 'volume', securityId: 'REGIONALE', multiple: 3 },
      channels: ['push', 'email'],
      enabled: false,
      securityCode: 'REGIONALE',
      portfolioName: null,
      createdAt: '2026-10-09T08:00:00Z',
      lastTriggeredAt: null,
    }
    const form = initialAlertForm(alert)
    expect(form).toMatchObject({
      type: 'volume',
      security: { id: 'REGIONALE', code: 'REGIONALE' },
      multiple: 3,
      channels: ['push', 'email'],
      enabled: false,
    })
    expect(toAlertInput(form)).toEqual({
      condition: alert.condition,
      channels: alert.channels,
      enabled: false,
    })
  })
})
