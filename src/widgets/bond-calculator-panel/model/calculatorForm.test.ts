import { describe, expect, it } from 'vitest'
import type { BondCalculationDto } from '@/shared/api/contracts'
import { initialForm, settlementDateAfter, shownFigures, toRequest } from './calculatorForm'

describe('bond calculator form', () => {
  it('settles two business days after the trade', () => {
    expect(settlementDateAfter('2026-10-28')).toBe('2026-10-30')
    expect(settlementDateAfter('2026-10-30')).toBe('2026-11-03')
  })

  it('sends the figure typed last', () => {
    const form = initialForm('2026-10-28', 101.4)
    expect(toRequest(form)).toEqual({
      settlementDate: '2026-10-30',
      faceAmount: 100_000_000,
      cleanPrice: 101.4,
    })
    expect(toRequest({ ...form, driver: 'yield', yieldPct: 5.5 })).toEqual({
      settlementDate: '2026-10-30',
      faceAmount: 100_000_000,
      yieldPct: 5.5,
    })
  })

  it('sends nothing while an input is missing or out of range', () => {
    const form = initialForm('2026-10-28', 101.4)
    expect(toRequest({ ...form, settlementDate: null })).toBeNull()
    expect(toRequest({ ...form, faceAmount: 0 })).toBeNull()
    expect(toRequest({ ...form, cleanPrice: null })).toBeNull()
    expect(toRequest({ ...form, driver: 'yield', yieldPct: 120 })).toBeNull()
  })

  it('shows the typed figure and the computed one', () => {
    const form = initialForm('2026-10-28', 101.4)
    const result = { cleanPrice: 99.8, yieldPct: 5.2419 } as BondCalculationDto
    expect(shownFigures(form, result)).toEqual({ cleanPrice: 101.4, yieldPct: 5.2419 })
    expect(shownFigures({ ...form, driver: 'yield', yieldPct: 6 }, result)).toEqual({
      cleanPrice: 99.8,
      yieldPct: 6,
    })
  })
})
