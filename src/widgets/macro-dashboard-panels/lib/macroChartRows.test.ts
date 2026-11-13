import { describe, expect, it } from 'vitest'
import type { MacroComparisonDto, MacroYearDto } from '@/shared/api/contracts'
import { macroChartRows } from './macroChartRows'

const year = (value: number, figure: number): MacroYearDto => ({
  year: value,
  value: figure,
  publisher: 'worldBank',
  comment: null,
})

const comparison: MacroComparisonDto = {
  indicator: 'gdpGrowth',
  unit: 'percent',
  nameEn: 'GDP growth',
  nameFr: 'Croissance du PIB',
  series: [
    {
      country: 'CMR',
      points: [year(2000, 4.2), year(2010, 3.3), year(2024, 3.4), year(2025, 3.6)],
    },
    { country: 'GAB', points: [year(2010, 6.3), year(2024, 2.8)] },
    { country: 'ZAF', points: [] },
  ],
}

describe('macroChartRows', () => {
  it('draws the period up to the latest year, a figure by economy where it has one', () => {
    const chart = macroChartRows(comparison, '15Y')

    expect([chart.from, chart.to, chart.rows.length]).toEqual([2010, 2025, 16])
    expect(chart.rows[0]).toEqual({ year: 2010, CMR: 3.3, GAB: 6.3 })
    expect(chart.rows.at(-1)).toEqual({ year: 2025, CMR: 3.6 })
  })

  it('starts every year since 1960 at the first year with a figure', () => {
    const chart = macroChartRows(comparison, 'MAX')

    expect([chart.from, chart.to, chart.rows.length]).toEqual([2000, 2025, 26])
  })

  it('draws nothing when no economy has a figure', () => {
    expect(
      macroChartRows({ ...comparison, series: [{ country: 'ZAF', points: [] }] }, '15Y'),
    ).toEqual({
      rows: [],
      from: 0,
      to: 0,
    })
  })
})
