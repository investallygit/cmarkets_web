/** The periods of screen 25's chart: the mockup's 2010 to 2025 is the latest year and fifteen before. */
export const MACRO_PERIODS = ['10Y', '15Y', '30Y', 'MAX'] as const
export type MacroPeriod = (typeof MACRO_PERIODS)[number]

/** The World Bank's series start in 1960. */
export const FIRST_MACRO_YEAR = 1960

const YEARS: Record<Exclude<MacroPeriod, 'MAX'>, number> = { '10Y': 10, '15Y': 15, '30Y': 30 }

/** The years a period spans up to the latest year with a figure, both included. */
export function macroPeriodRange(
  period: MacroPeriod,
  latestYear: number,
): { from: number; to: number } {
  if (period === 'MAX') return { from: FIRST_MACRO_YEAR, to: latestYear }
  return { from: Math.max(FIRST_MACRO_YEAR, latestYear - YEARS[period]), to: latestYear }
}
