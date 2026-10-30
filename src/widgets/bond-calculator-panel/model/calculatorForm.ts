import type { BondCalculationDto, BondCalculationRequestDto } from '@/shared/api/contracts'
import { addDays, isWeekend } from '@/shared/lib/isoDate'

/** Settlement two business days after the trade, as in the screen 4 mockup (28/10 -> 30/10). */
const SETTLEMENT_LAG = 2
/** Face amount of the mockup. */
const DEFAULT_FACE_AMOUNT = 100_000_000

export interface CalculatorForm {
  settlementDate: string | null
  faceAmount: number | null
  /** The figure typed last; the server computes the other one. */
  driver: 'price' | 'yield'
  cleanPrice: number | null
  yieldPct: number | null
}

export function settlementDateAfter(tradeDate: string): string {
  let day = tradeDate
  for (let remaining = SETTLEMENT_LAG; remaining > 0;) {
    day = addDays(day, 1)
    if (!isWeekend(day)) remaining -= 1
  }
  return day
}

/** Today's trade at the last price, for the face amount of the mockup. */
export function initialForm(today: string, lastPrice: number | null): CalculatorForm {
  return {
    settlementDate: settlementDateAfter(today),
    faceAmount: DEFAULT_FACE_AMOUNT,
    driver: 'price',
    cleanPrice: lastPrice,
    yieldPct: null,
  }
}

/** POST /bonds/{id}/calculate for the inputs, or null while one is missing or out of range. */
export function toRequest(form: CalculatorForm): BondCalculationRequestDto | null {
  const { settlementDate, faceAmount, cleanPrice, yieldPct } = form
  if (!settlementDate || faceAmount === null || faceAmount <= 0) return null
  if (form.driver === 'price') {
    return cleanPrice !== null && cleanPrice > 0 ? { settlementDate, faceAmount, cleanPrice } : null
  }
  return yieldPct !== null && yieldPct > -50 && yieldPct < 100
    ? { settlementDate, faceAmount, yieldPct }
    : null
}

/** The price and the yield in the inputs: the one typed, and the one computed from it. */
export function shownFigures(
  form: CalculatorForm,
  result: BondCalculationDto | undefined,
): { cleanPrice: number | null; yieldPct: number | null } {
  return form.driver === 'price'
    ? { cleanPrice: form.cleanPrice, yieldPct: result?.yieldPct ?? null }
    : { cleanPrice: result?.cleanPrice ?? null, yieldPct: form.yieldPct }
}
