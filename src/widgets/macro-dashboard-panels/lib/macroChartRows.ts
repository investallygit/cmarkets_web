import { macroPeriodRange, type MacroPeriod } from '@/entities/macro'
import type { MacroComparisonDto } from '@/shared/api/contracts'

/** A year of the chart: a figure by economy code, none where an economy has none that year. */
export interface MacroChartRow {
  year: number
  [country: string]: number | undefined
}

export interface MacroChart {
  rows: MacroChartRow[]
  /** The years drawn: the period's, from the first year any economy has a figure of. */
  from: number
  to: number
}

/**
 * The rows of screen 25's chart: a year each over the period up to the latest year with a figure,
 * from the first year one of the economies has a figure of.
 */
export function macroChartRows(comparison: MacroComparisonDto, period: MacroPeriod): MacroChart {
  const years = comparison.series.flatMap((series) => series.points.map((point) => point.year))
  if (years.length === 0) return { rows: [], from: 0, to: 0 }
  const range = macroPeriodRange(period, Math.max(...years))
  const from = Math.max(range.from, Math.min(...years.filter((year) => year >= range.from)))
  const byYear = new Map<number, MacroChartRow>()
  for (let year = from; year <= range.to; year++) byYear.set(year, { year })
  for (const series of comparison.series) {
    for (const point of series.points) {
      const row = byYear.get(point.year)
      if (row) row[series.country] = point.value
    }
  }
  return { rows: [...byYear.values()], from, to: range.to }
}
