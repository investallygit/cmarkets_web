import { STANDARD_TENORS, type StandardTenor } from '@/shared/api/contracts'
import { roundRate, type DiscountForm, type ScheduleRow } from './discountForm'
import { spreadBp } from './rateEntry'

/** The rates block B's status checks, in percent: the spec's "0–30% check" (screen 16). */
export const CHECK_RANGE = [0, 30] as const

/**
 * Block B's entry status (spec section 9, sixth version; ROADMAP decision 56): how many rates are
 * entered for the dates (or the tenors), how many lie outside 0 to 30%, the average spread to the
 * reference curve, and whether the rates still are the curve's they started from.
 */
export interface EntryStatus {
  entered: number
  /** The cash-flow dates, or the standard tenors. */
  total: number
  /** By date, the dates without a rate: Calculate waits for them. Tenors left empty are not used. */
  missing: number
  outside: number
  /** In bp to one decimal; null without a rate beside a reference. */
  averageSpread: number | null
  /** A rate differs from its reference, as "Start from" copies it (three decimals). */
  modified: boolean
}

export function entryStatus(
  discount: DiscountForm,
  rows: readonly ScheduleRow[],
  references: {
    rows: readonly (number | null)[]
    tenors: Readonly<Record<StandardTenor, number | null>>
  } | null,
): EntryStatus {
  const byTenor = discount.entry === 'tenors'
  const pairs: [number | null, number | null][] = byTenor
    ? STANDARD_TENORS.map((tenor) => [discount.tenors[tenor], references?.tenors[tenor] ?? null])
    : rows.map((row, index) => [discount.rates[row.date] ?? null, references?.rows[index] ?? null])
  const rates = pairs.flatMap(([rate]) => (rate === null ? [] : [rate]))
  const spreads = pairs.flatMap(([rate, reference]) => {
    const spread = spreadBp(rate, reference)
    return spread === null ? [] : [spread]
  })
  const sum = spreads.reduce((total, spread) => total + spread, 0)
  return {
    entered: rates.length,
    total: pairs.length,
    missing: byTenor ? 0 : pairs.length - rates.length,
    outside: rates.filter((rate) => rate < CHECK_RANGE[0] || rate > CHECK_RANGE[1]).length,
    averageSpread: spreads.length === 0 ? null : Math.round((sum / spreads.length) * 10) / 10,
    modified: pairs.some(
      ([rate, reference]) => rate !== null && (reference === null || roundRate(reference) !== rate),
    ),
  }
}
