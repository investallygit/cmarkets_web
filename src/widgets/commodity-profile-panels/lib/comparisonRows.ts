import type { CommodityComparisonDto } from '@/shared/api/contracts'

/** A month of the comparison chart: each series' value rebased to 100, by its code. */
export type ComparisonRow = { date: string } & Record<string, number | string>

/** The comparison's series as the chart's rows, a month a row, oldest first. */
export function comparisonRows(comparison: CommodityComparisonDto): ComparisonRow[] {
  const rows = new Map<string, ComparisonRow>()
  for (const series of comparison.series) {
    for (const point of series.points) {
      const row = rows.get(point.date) ?? { date: point.date }
      row[series.code] = point.value
      rows.set(point.date, row)
    }
  }
  return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * The codes CMP starts with: the commodity and the series its statistics correlate it with (the
 * mockup's Brent and WTI), the one alone without.
 */
export function initialComparison(code: string, reference: string | null | undefined): string[] {
  return reference && reference !== code ? [code, reference] : [code]
}

/** A code added or taken away, five at most, the profile's own kept. */
export function toggleCode(
  codes: readonly string[],
  code: string,
  own: string,
  max: number,
): string[] {
  if (codes.includes(code)) return code === own ? [...codes] : codes.filter((item) => item !== code)
  return codes.length >= max ? [...codes] : [...codes, code]
}
