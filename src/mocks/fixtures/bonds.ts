import type { BondCashFlowDto, BondDto, BondSummaryDto } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'

type BondTerms = Omit<BondDto, 'schedule' | 'amountOutstanding'> & {
  /** Face value at issue, in the bond's currency. */
  amountIssued: number
}

/**
 * ECMR follows the test case of spec section 14.1: issued 04/11/2024, maturing 04/11/2029,
 * annual coupon 6.25%, 20% of the principal repaid each year (case B). BVMAC bonds have a
 * nominal of XAF 10,000.
 */
// prettier-ignore
export const BOND_FIXTURES: Record<string, BondTerms> = {
  'ECMR-6.25-2029': {
    id: 'ECMR-6.25-2029', code: 'ECMR 6.25% 29', name: 'Republic of Cameroon 6.25% 2025-2029',
    issuer: 'Republic of Cameroon', country: 'CM', currency: 'XAF', couponPct: 6.25, frequency: 1,
    issueDate: '2024-11-04', maturityDate: '2029-11-04', amortization: 'straight',
    dayCount: 'ACT/ACT ICMA', nominal: 10_000, amountIssued: 200_000_000_000,
  },
  'GAB-6.50-2028': {
    id: 'GAB-6.50-2028', code: 'GAB 6.50% 28', name: 'Gabonese Republic 6.50% 2028',
    issuer: 'Gabonese Republic', country: 'GA', currency: 'XAF', couponPct: 6.5, frequency: 1,
    issueDate: '2023-06-15', maturityDate: '2028-06-15', amortization: 'bullet',
    dayCount: 'ACT/ACT ICMA', nominal: 10_000, amountIssued: 150_000_000_000,
  },
}

function addYears(day: string, years: number): string {
  return `${Number(day.slice(0, 4)) + years}${day.slice(4)}`
}

/** Every payment of the bond, per 100 of original face value (spec section 14.1). */
export function cashFlows(terms: BondTerms): BondCashFlowDto[] {
  const dates: string[] = []
  for (let year = 1; addYears(terms.issueDate, year) <= terms.maturityDate; year++) {
    dates.push(addYears(terms.issueDate, year))
  }
  let outstanding = 100
  return dates.map((date, index) => {
    const last = index === dates.length - 1
    const amortization =
      terms.amortization === 'straight' ? 100 / dates.length : last ? outstanding : 0
    const coupon = (outstanding * terms.couponPct) / 100 / terms.frequency
    outstanding = Number((outstanding - amortization).toFixed(4))
    return { date, coupon: Number(coupon.toFixed(4)), amortization, outstanding }
  })
}

/** The terms, with the amount still outstanding after the payments made by `today`. */
function summaryOf(terms: BondTerms, schedule: BondCashFlowDto[], today: string): BondSummaryDto {
  const { amountIssued, ...summary } = terms
  const paid = schedule.filter((flow) => flow.date <= today).at(-1)
  return { ...summary, amountOutstanding: (amountIssued * (paid?.outstanding ?? 100)) / 100 }
}

/** GET /bonds/{id}: the terms and every payment. */
export function bondOf(id: string, now = Date.now()): BondDto | undefined {
  const terms = BOND_FIXTURES[id]
  if (!terms) return undefined
  const schedule = cashFlows(terms)
  return { ...summaryOf(terms, schedule, toMarketDay(now)), schedule }
}

/** GET /bonds */
export function bondSummaries(now = Date.now()): BondSummaryDto[] {
  return Object.values(BOND_FIXTURES).map((terms) =>
    summaryOf(terms, cashFlows(terms), toMarketDay(now)),
  )
}
