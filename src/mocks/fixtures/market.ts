import type { PolicyRateDto } from '@/shared/api/contracts'

export interface IndexFixture {
  code: string
  name: string
  value: number
  previousClose: number
}

/** Indices of the screen 1 mockup (sample values). */
export const INDEX_FIXTURES: IndexFixture[] = [
  { code: 'BVMAC-A', name: 'BVMAC Equities', value: 1284.37, previousClose: 1278.98 },
  { code: 'CMK-BANK', name: 'CMarket Banks', value: 982.1, previousClose: 972.77 },
  { code: 'CMK-AGRI', name: 'CMarket Agribusiness', value: 1104.55, previousClose: 1107.97 },
  { code: 'CMK-CM', name: 'CMarket Cameroon', value: 1210.02, previousClose: 1205.42 },
  { code: 'CMK-GA', name: 'CMarket Gabon', value: 874.6, previousClose: 880.02 },
  { code: 'CMK-BOND', name: 'CMarket Bonds', value: 1032.18, previousClose: 1031.77 },
  { code: 'MCAP', name: 'Market cap (XAF bn)', value: 1214.6, previousClose: 1209.5 },
]

export const POLICY_RATE_FIXTURES: Omit<PolicyRateDto, 'asOf'>[] = [
  { id: 'BEAC-TIAO', name: 'BEAC main refinancing rate', value: 5, change: 0 },
  { id: 'BEAC-MLF', name: 'Marginal lending facility rate', value: 6.75, change: 0 },
]

export interface FxFixture {
  pair: string
  base: string
  quote: string
  value: number
  previousClose: number
  isFixed: boolean
  decimals: number
}

/** EUR/XAF is pegged at 655.957 (spec section 14.2). */
// prettier-ignore
export const FX_FIXTURES: FxFixture[] = [
  { pair: 'EURXAF', base: 'EUR', quote: 'XAF', value: 655.957, previousClose: 655.957, isFixed: true, decimals: 3 },
  { pair: 'USDXAF', base: 'USD', quote: 'XAF', value: 605.12, previousClose: 606.21, isFixed: false, decimals: 2 },
  { pair: 'CNYXAF', base: 'CNY', quote: 'XAF', value: 84.31, previousClose: 84.25, isFixed: false, decimals: 2 },
]
