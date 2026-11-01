import { accruedInterest, bondMeasures, settlementPeriod, yieldFromCleanPrice } from '../bondMath'
import type { MarketData, PortfolioBond } from './model'

/**
 * What the calculations share: the value of one point of a bond's price, its accrued interest and
 * duration, amounts to the cent, days between two dates.
 */

export const round2 = (value: number) => Math.round(value * 100) / 100

/** Principal outstanding after the payments made by `day`, per 100 of original face value. */
export function outstandingPct(bond: PortfolioBond, day: string): number {
  return bond.schedule.findLast((flow) => flow.date <= day)?.outstanding ?? 100
}

/** Value of one point of price per bond: nominal × outstanding / 100 / 100; 1 for a share. */
export function unitValue(market: MarketData, securityId: string, day: string): number {
  const bond = market.bond(securityId)
  return bond ? (bond.nominal * outstandingPct(bond, day)) / 10_000 : 1
}

/** Accrued interest per 100 of principal outstanding; 0 for a share, before issue or after maturity. */
export function accruedOn(market: MarketData, securityId: string, day: string): number {
  const bond = market.bond(securityId)
  if (!bond) return 0
  try {
    return accruedInterest(bond, settlementPeriod(bond, day))
  } catch {
    return 0
  }
}

export function modifiedDuration(
  bond: PortfolioBond,
  day: string,
  cleanPrice: number,
): number | null {
  try {
    const period = settlementPeriod(bond, day)
    return bondMeasures(bond, period, yieldFromCleanPrice(bond, period, cleanPrice))
      .modifiedDuration
  } catch {
    return null
  }
}

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)
