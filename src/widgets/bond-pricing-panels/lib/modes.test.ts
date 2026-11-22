import { describe, expect, it } from 'vitest'
import type { CurveDto } from '@/shared/api/contracts'
import { modeKey, shocksByTenor } from './modes'

const curve = (kind: CurveDto['kind']): CurveDto => ({
  id: kind === 'cmarket' ? 'cmkt-CM' : 'b1',
  name: 'Q4 rate-rise scenario',
  kind,
  country: null,
  date: '2026-10-29',
  shared: true,
  mine: true,
  owner: 'P. Owona',
  points: [],
})

describe('the modes of bond pricing', () => {
  it('names the tenors as rates entered', () => {
    expect(['yield', 'curve', 'rates', 'tenors'].map((mode) => modeKey(mode as never))).toEqual([
      'yield',
      'curve',
      'rates',
      'rates',
    ])
  })

  it('shocks one tenor of a custom curve or of the tenors entered, not of CMarket’s curve', () => {
    expect(shocksByTenor({ mode: 'curve', curve: curve('custom') })).toBe(true)
    expect(shocksByTenor({ mode: 'tenors', curve: null })).toBe(true)
    expect(shocksByTenor({ mode: 'curve', curve: curve('cmarket') })).toBe(false)
    expect(shocksByTenor({ mode: 'rates', curve: null })).toBe(false)
    expect(shocksByTenor({ mode: 'yield', curve: null })).toBe(false)
  })
})
