import type { BondCashFlowDto, DayCount } from '@/shared/api/contracts'
import { DAY_MS } from './time'

/**
 * Bond calculator of spec section 14.1, as CMarket.Domain computes it. Prices are per 100 of the
 * principal outstanding at settlement; yields are fractions here (0.0625), percent in the API.
 */
export interface BondTerms {
  couponPct: number
  /** Coupons per year. */
  frequency: number
  issueDate: string
  maturityDate: string
  dayCount: DayCount
  /** Every payment, per 100 of original face value. */
  schedule: readonly BondCashFlowDto[]
}

export type BondMathErrorCode = 'beforeIssue' | 'matured' | 'noYield'

export class BondMathError extends Error {
  readonly code: BondMathErrorCode

  constructor(code: BondMathErrorCode) {
    super(code)
    this.code = code
  }
}

interface FutureFlow {
  /** CF_i = Coupon_i + Amort_i, per 100 of original face value. */
  cashFlow: number
  amortization: number
  /** w + i − 1: coupon periods from settlement to the payment. */
  periods: number
  /** Actual days from settlement to the payment over 365, for the average life. */
  yearsToPayment: number
}

export interface SettlementPeriod {
  /** A: days from the last coupon date to settlement. */
  accruedDays: number
  /** E: days in the current coupon period. */
  periodDays: number
  /** OUT_1: principal outstanding at settlement, per 100 of original face value. */
  outstanding: number
  flows: FutureFlow[]
}

function actualDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)
}

/** 30/360 bond basis: a 31st counts as the 30th. */
function days30360(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number)
  const [y2, m2, d2] = to.split('-').map(Number)
  const start = Math.min(d1, 30)
  const end = d2 === 31 && start === 30 ? 30 : d2
  return 360 * (y2 - y1) + 30 * (m2 - m1) + (end - start)
}

function dayCountDays(dayCount: DayCount, from: string, to: string): number {
  return dayCount === '30/360' ? days30360(from, to) : actualDays(from, to)
}

function periodLength(bond: BondTerms, from: string, to: string): number {
  switch (bond.dayCount) {
    case 'ACT/ACT ICMA':
      return actualDays(from, to)
    case 'ACT/365F':
      return 365 / bond.frequency
    case 'ACT/360':
    case '30/360':
      return 360 / bond.frequency
  }
}

/** Where the settlement date falls in the schedule, and the payments still to come. */
export function settlementPeriod(bond: BondTerms, settlementDate: string): SettlementPeriod {
  if (settlementDate < bond.issueDate) throw new BondMathError('beforeIssue')
  // A coupon paid on the settlement date goes to the seller.
  const next = bond.schedule.findIndex((flow) => flow.date > settlementDate)
  if (next === -1) throw new BondMathError('matured')
  const lastDate = next === 0 ? bond.issueDate : bond.schedule[next - 1].date
  const nextDate = bond.schedule[next].date
  const outstanding = next === 0 ? 100 : bond.schedule[next - 1].outstanding
  const periodDays = periodLength(bond, lastDate, nextDate)
  const w = dayCountDays(bond.dayCount, settlementDate, nextDate) / periodDays

  let principal = outstanding
  const flows = bond.schedule.slice(next).map((flow, index) => {
    const coupon = (principal * bond.couponPct) / 100 / bond.frequency
    principal -= flow.amortization
    return {
      cashFlow: coupon + flow.amortization,
      amortization: flow.amortization,
      periods: w + index,
      yearsToPayment: actualDays(settlementDate, flow.date) / 365,
    }
  })
  return {
    accruedDays: dayCountDays(bond.dayCount, lastDate, settlementDate),
    periodDays,
    outstanding,
    flows,
  }
}

/** AI per 100 outstanding = (c / f) × A / E × 100. */
export function accruedInterest(bond: BondTerms, period: SettlementPeriod): number {
  return ((bond.couponPct / bond.frequency) * period.accruedDays) / period.periodDays
}

/** Dirty price Σ PV_i × 100 / OUT_1, and its derivative with respect to the yield. */
function priceAndSlope(bond: BondTerms, period: SettlementPeriod, y: number): [number, number] {
  const base = 1 + y / bond.frequency
  let price = 0
  let slope = 0
  for (const flow of period.flows) {
    const pv = flow.cashFlow / base ** flow.periods
    price += pv
    slope -= (flow.periods * pv) / base / bond.frequency
  }
  const scale = 100 / period.outstanding
  return [price * scale, slope * scale]
}

export function dirtyPrice(bond: BondTerms, period: SettlementPeriod, y: number): number {
  return priceAndSlope(bond, period, y)[0]
}

const PRICE_TOLERANCE = 1e-10
const MAX_NEWTON_STEPS = 50
const BISECTION_RANGE: readonly [number, number] = [-0.5, 1]

/**
 * Solves clean price(y) = the price entered: Newton-Raphson from y0 = c, then bisection on
 * [−50%; +100%] if it does not converge. Throws noYield when no yield in that range fits.
 */
export function yieldFromCleanPrice(
  bond: BondTerms,
  period: SettlementPeriod,
  cleanPrice: number,
): number {
  const target = cleanPrice + accruedInterest(bond, period)
  let y = bond.couponPct / 100
  for (let step = 0; step < MAX_NEWTON_STEPS && 1 + y / bond.frequency > 0; step++) {
    const [price, slope] = priceAndSlope(bond, period, y)
    if (Math.abs(price - target) < PRICE_TOLERANCE) return y
    if (!Number.isFinite(slope) || slope === 0) break
    y -= (price - target) / slope
  }

  let [low, high] = BISECTION_RANGE
  const gap = (rate: number) => dirtyPrice(bond, period, rate) - target
  let lowGap = gap(low)
  if (lowGap * gap(high) > 0) throw new BondMathError('noYield')
  for (let step = 0; step < 200; step++) {
    const middle = (low + high) / 2
    const middleGap = gap(middle)
    if (Math.abs(middleGap) < PRICE_TOLERANCE) return middle
    if (lowGap * middleGap < 0) high = middle
    else [low, lowGap] = [middle, middleGap]
  }
  return (low + high) / 2
}

export interface BondMeasures {
  macaulayDuration: number
  modifiedDuration: number
  convexity: number
  averageLife: number
}

/** Macaulay and modified durations, convexity (t_i = (w + i − 1) / f) and average life. */
export function bondMeasures(bond: BondTerms, period: SettlementPeriod, y: number): BondMeasures {
  const f = bond.frequency
  const base = 1 + y / f
  let sumPv = 0
  let sumTimePv = 0
  let sumConvexity = 0
  let sumAmortization = 0
  let sumLife = 0
  for (const flow of period.flows) {
    const pv = flow.cashFlow / base ** flow.periods
    const t = flow.periods / f
    sumPv += pv
    sumTimePv += t * pv
    sumConvexity += t * (t + 1 / f) * pv
    sumAmortization += flow.amortization
    sumLife += flow.yearsToPayment * flow.amortization
  }
  const macaulayDuration = sumTimePv / sumPv
  return {
    macaulayDuration,
    modifiedDuration: macaulayDuration / base,
    convexity: sumConvexity / (sumPv * base ** 2),
    averageLife: sumLife / sumAmortization,
  }
}

export interface BondCalculationInput {
  settlementDate: string
  /** Original face amount. */
  faceAmount: number
  cleanPrice?: number
  /** In percent. */
  yieldPct?: number
}

const roundAmount = (value: number) => Math.round(value * 100) / 100

/** Everything the YAS screen shows, from the clean price or from the yield. */
export function calculateBond(bond: BondTerms, input: BondCalculationInput) {
  const period = settlementPeriod(bond, input.settlementDate)
  const accrued = accruedInterest(bond, period)
  const y =
    input.cleanPrice === undefined
      ? (input.yieldPct ?? 0) / 100
      : yieldFromCleanPrice(bond, period, input.cleanPrice)
  const dirty = dirtyPrice(bond, period, y)
  const cleanPrice = input.cleanPrice ?? dirty - accrued
  const measures = bondMeasures(bond, period, y)
  const outstandingFace = (input.faceAmount * period.outstanding) / 100
  return {
    cleanPrice,
    yieldPct: y * 100,
    outstandingPct: period.outstanding,
    accruedDays: period.accruedDays,
    periodDays: period.periodDays,
    accruedInterest: accrued,
    dirtyPrice: dirty,
    outstandingFace: roundAmount(outstandingFace),
    accruedAmount: roundAmount((accrued / 100) * outstandingFace),
    settlementAmount: roundAmount(((cleanPrice + accrued) / 100) * outstandingFace),
    ...measures,
    dv01: roundAmount((measures.modifiedDuration * dirty * outstandingFace) / 100 / 10_000),
  }
}

/**
 * A BTA rate (simple interest, 360-day basis) as an annual compound yield, in percent:
 * y = (1 + r × d / 360)^(365 / d) − 1.
 */
export function btaCompoundYield(ratePct: number, days: number): number {
  return ((1 + ((ratePct / 100) * days) / 360) ** (365 / days) - 1) * 100
}

interface CurvePoint {
  years: number
  yieldPct: number
}

/** Linear interpolation between the points; null beyond the first and last (no extrapolation). */
export function interpolateCurve(points: readonly CurvePoint[], years: number): number | null {
  const after = points.findIndex((point) => point.years >= years)
  if (after === -1) return null
  const upper = points[after]
  if (upper.years === years) return upper.yieldPct
  if (after === 0) return null
  const lower = points[after - 1]
  const share = (years - lower.years) / (upper.years - lower.years)
  return lower.yieldPct + share * (upper.yieldPct - lower.yieldPct)
}
