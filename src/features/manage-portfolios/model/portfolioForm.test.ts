import { describe, expect, it } from 'vitest'
import type { PortfolioDto } from '@/shared/api/contracts'
import {
  cashWeight,
  initialPortfolioForm,
  newLine,
  toCreateInput,
  toUpdateInput,
  validatePortfolioForm,
} from './portfolioForm'

const TODAY = '2026-10-30'
const codeOf = (id: string) => (id === 'ECMR-6.25-2029' ? 'ECMR 6.25% 29' : id)

describe('portfolio form', () => {
  it('starts a Student on a model portfolio', () => {
    expect(initialPortfolioForm(null, true, TODAY, codeOf).kind).toBe('model')
    const form = initialPortfolioForm(null, false, TODAY, codeOf)
    expect(form).toMatchObject({ kind: 'real', currency: 'XAF', benchmark: 'BVMAC-A' })
    expect(validatePortfolioForm(form, TODAY)).toEqual({ name: 'required' })
  })

  it('checks the limits: positive, percentages up to 100', () => {
    const form = initialPortfolioForm(null, false, TODAY, codeOf)
    const limits = { ...form.limits, issuerWeightPct: 120, beta: 0, durationYears: 3 }
    expect(validatePortfolioForm({ ...form, name: 'Fund', limits }, TODAY)).toEqual({
      limits: { issuerWeightPct: 'percent', beta: 'positive' },
    })
  })

  it('needs a model allocation of 100% at most, each security once', () => {
    const base = { ...initialPortfolioForm(null, true, TODAY, codeOf), name: 'Model' }
    const semc = { ...newLine({ id: 'SEMC', code: 'SEMC' }), weightPct: 60 }
    const again = { ...newLine({ id: 'SEMC', code: 'SEMC' }), weightPct: 50 }
    const form = { ...base, lines: [semc, again] }
    expect(cashWeight(form)).toBe(-10)
    expect(validatePortfolioForm(form, TODAY)).toEqual({
      lines: 'overAllocated',
      line: { [again.key]: { security: 'duplicate' } },
    })
    expect(validatePortfolioForm({ ...base, lines: [] }, TODAY)).toEqual({ lines: 'noLine' })
    expect(
      validatePortfolioForm({ ...base, startDate: '2026-11-02', lines: [semc] }, TODAY),
    ).toEqual({ startDate: 'future' })
  })

  it('sends the allocation of a model portfolio, and nothing of it for a real one', () => {
    const form = {
      ...initialPortfolioForm(null, true, TODAY, codeOf),
      name: ' Banks ',
      lines: [{ ...newLine({ id: 'BANGE', code: 'BANGE' }), weightPct: 40 }],
    }
    expect(toCreateInput(form)).toEqual({
      name: 'Banks',
      kind: 'model',
      currency: 'XAF',
      benchmark: 'BVMAC-A',
      limits: form.limits,
      model: {
        notional: 100_000_000,
        startDate: TODAY,
        lines: [{ securityId: 'BANGE', weightPct: 40 }],
      },
    })
    expect(toCreateInput({ ...form, kind: 'real' }).model).toBeNull()
  })

  it('reopens the settings with the codes of the model lines and their version', () => {
    const portfolio: PortfolioDto = {
      id: 'portfolio-1',
      name: 'Bonds',
      kind: 'model',
      currency: 'EUR',
      benchmark: 'CMK-BOND',
      inceptionDate: '2025-01-02',
      limits: {
        issuerWeightPct: 60,
        volatilityPct: null,
        drawdownPct: null,
        beta: null,
        durationYears: 4,
      },
      model: {
        notional: 1_000_000,
        startDate: '2025-01-02',
        lines: [{ securityId: 'ECMR-6.25-2029', weightPct: 60 }],
      },
      version: '4',
    }
    const form = initialPortfolioForm(portfolio, false, TODAY, codeOf)
    expect(form.lines.map((line) => line.security)).toEqual([
      { id: 'ECMR-6.25-2029', code: 'ECMR 6.25% 29' },
    ])
    expect(toUpdateInput(form, portfolio.version)).toMatchObject({
      name: 'Bonds',
      benchmark: 'CMK-BOND',
      version: '4',
      model: { notional: 1_000_000, lines: [{ securityId: 'ECMR-6.25-2029', weightPct: 60 }] },
    })
  })
})
