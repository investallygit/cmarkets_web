import type { CurrencyCode, SecurityType } from '@/shared/api/contracts'

export const INDEX_DECIMALS = 2

/** XAF equities trade in whole francs; bonds are quoted per 100 with 2 decimals. */
export function priceDecimals(type: SecurityType | 'index', currency: CurrencyCode): number {
  if (type === 'index' || type === 'bond') return 2
  return currency === 'XAF' ? 0 : 2
}
