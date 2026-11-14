import type { OptAssetClass } from '@/shared/api/contracts'

/** The mockups' colours of a class: equities blue, bonds green, ETFs purple (spec screens 28 and 29). */
export const OPT_CLASS_COLOR: Readonly<Record<OptAssetClass, string>> = {
  equity: 'var(--info)',
  bond: 'var(--up)',
  etf: 'var(--type-trader)',
}
