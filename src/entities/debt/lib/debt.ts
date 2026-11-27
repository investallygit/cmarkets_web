import type { DebtPeriodDto, SovereignRatingDto } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES, type CemacCountry, cemacCode3 } from '@/shared/config/countries'

/** The whole zone, in place of a state (screen 35). */
export const DEBT_ZONE = 'CEMAC'

/** The country bar of the mockup: the six states by their three letters, then the zone. */
export const DEBT_COUNTRIES: readonly { code: string; country: CemacCountry | null }[] = [
  ...CEMAC_COUNTRIES.map((country) => ({ code: cemacCode3(country), country })),
  { code: DEBT_ZONE, country: null },
]

/** The bar's code of what `DEBT CMR` or ?country= asks: three letters, two, or CEMAC; null for another. */
export function debtCountry(asked: string | null | undefined): string | null {
  const code = asked?.trim().toUpperCase()
  if (!code) return null
  return DEBT_COUNTRIES.find((entry) => entry.code === code || entry.country === code)?.code ?? null
}

/** A state's two letters from its three ("CMR" gives "CM"); null for the zone. */
export function debtState(code: string): CemacCountry | null {
  return DEBT_COUNTRIES.find((entry) => entry.code === code)?.country ?? null
}

const BILLION = 1_000_000_000

/** XAF in billions, as the mockup writes the debt. */
export function billions(amount: number): number {
  return amount / BILLION
}

/** A bar of the redemption schedule, in billions of XAF. */
export interface ScheduleBar {
  label: string
  bta: number
  ota: number
  total: number
}

/**
 * The schedule's bars as the mockup labels them: "Q4 26" for a quarter of the current year (the
 * caller words it), "2027" for a year, "2033+" for the years beyond.
 */
export function scheduleBars(
  periods: readonly DebtPeriodDto[],
  quarterLabel: (quarter: number, year: number) => string,
): ScheduleBar[] {
  return periods.map((period) => {
    const bta = billions(period.bta)
    const ota = billions(period.ota)
    const label =
      period.kind === 'quarter'
        ? quarterLabel(period.quarter ?? 1, period.year)
        : period.kind === 'beyond'
          ? `${period.year}+`
          : String(period.year)
    return { label, bta, ota, total: bta + ota }
  })
}

/** "B- / Caa1": S&P's and Moody's ratings in force, the indicator of the mockup; null without either. */
export function ratingPair(
  ratings: readonly SovereignRatingDto[] | null | undefined,
): string | null {
  if (!ratings) return null
  const rating = (agency: SovereignRatingDto['agency']) =>
    ratings.find((entry) => entry.agency === agency)?.rating ?? null
  const pair = [rating('sp'), rating('moodys')].filter((value): value is string => value !== null)
  return pair.length > 0 ? pair.join(' / ') : null
}
