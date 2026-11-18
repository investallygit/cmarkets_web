import { describe, expect, it } from 'vitest'
import type { XafCrossesDto } from '@/shared/api/contracts'
import { aumInFrancs } from './aumInFrancs'

const crosses = {
  parity: 655.957,
  date: '2026-11-16',
  crosses: [{ currency: 'USD', unit: 1, xaf: 604.68 }],
} as unknown as XafCrossesDto

describe('aumInFrancs (B64)', () => {
  it('puts a fund in euros above a smaller one in dollars', () => {
    const euros = aumInFrancs(84.6e9, 'EUR', crosses) ?? 0
    const dollars = aumInFrancs(89.3e9, 'USD', crosses) ?? 0
    expect(euros).toBeGreaterThan(dollars)
    expect(aumInFrancs(null, 'USD', crosses)).toBeUndefined()
    expect(aumInFrancs(5e9, 'GBP', crosses)).toBe(5e9)
  })
})
