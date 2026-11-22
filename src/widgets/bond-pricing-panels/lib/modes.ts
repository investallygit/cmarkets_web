import type { BondPriceDto, DiscountMode } from '@/shared/api/contracts'

/** Block B's three modes as the screen names them: the tenors are rates entered. */
export type ModeKey = 'yield' | 'curve' | 'rates'

export function modeKey(mode: DiscountMode): ModeKey {
  return mode === 'tenors' ? 'rates' : mode
}

/**
 * Whether the sensitivity may shock one tenor alone (spec section 9, screen 16: "a custom curve
 * also accepts a shock by tenor"): a custom curve, or the rates entered by tenor.
 */
export function shocksByTenor(discount: BondPriceDto['discount']): boolean {
  return (
    discount.mode === 'tenors' || (discount.mode === 'curve' && discount.curve?.kind === 'custom')
  )
}
