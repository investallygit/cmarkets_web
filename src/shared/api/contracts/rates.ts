import type { CurrencyCode, IsoDate, IsoDateTime } from './common'

/** GET /rates/policy (BEAC rates, in %). */
export interface PolicyRateDto {
  id: string
  name: string
  value: number
  /** Change in percentage points since the previous decision. */
  change: number
  asOf: IsoDate
}

/** GET /fx?pairs=EURXAF,USDXAF */
export interface FxRateDto {
  pair: string
  base: CurrencyCode
  quote: CurrencyCode
  value: number
  changePct: number
  /** EUR/XAF is pegged at 655.957. */
  isFixed: boolean
  decimals: number
  timestamp: IsoDateTime
}
