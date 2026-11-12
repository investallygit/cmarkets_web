import { describe, expect, it } from 'vitest'
import type { EtfDistributionItemDto, EtfHoldingDto } from '@/shared/api/contracts'
import { barWidths, foldAllocation, holdingsRest, paidOverYear, paidPerYear } from './portfolio'

const line = (name: string, weightPct: number): EtfHoldingDto => ({
  rank: 0,
  name,
  weightPct,
  securityId: null,
  isin: null,
  sector: null,
  country: null,
})

const paid = (exDate: string, amount: number): EtfDistributionItemDto => ({
  exDate,
  paymentDate: exDate,
  amount,
  currency: 'USD',
})

describe("an ETF's portfolio on screen 19", () => {
  it('shows the six largest classes and folds the rest with what the source calls other', () => {
    const items = [
      { key: 'technology', weightPct: 26.1 },
      { key: 'financials', weightPct: 15.8 },
      { key: 'industrials', weightPct: 10.9 },
      { key: 'healthCare', weightPct: 10.2 },
      { key: 'consumerDiscretionary', weightPct: 10 },
      { key: 'communication', weightPct: 8.1 },
      { key: 'consumerStaples', weightPct: 6 },
      { key: 'cash', weightPct: 1 },
      { key: 'other', weightPct: 11.9 },
    ] as const
    const rows = foldAllocation(items)

    expect(rows.map((row) => row.key)).toEqual([
      'technology',
      'financials',
      'industrials',
      'healthCare',
      'consumerDiscretionary',
      'communication',
      'other',
    ])
    expect(rows.at(-1)?.weightPct).toBeCloseTo(18.9)
    // Six or fewer: nothing to fold.
    expect(foldAllocation(items.slice(0, 2)).map((row) => row.key)).toEqual([
      'technology',
      'financials',
    ])
  })

  it('says what the listed lines leave out and draws each bar against the largest', () => {
    const items = [line('Apple', 4.9), line('Microsoft', 4.4), line('NVIDIA', 4.3)]

    const rest = holdingsRest(items, 1_523)
    expect(rest.others).toBe(1_520)
    expect(rest.othersPct).toBeCloseTo(86.4)
    expect(holdingsRest(items, null).others).toBe(0)
    expect(barWidths(items).map((width) => Math.round(width))).toEqual([100, 90, 88])
    expect(barWidths([])).toEqual([])
  })

  it('adds up the distributions per calendar year and over the last twelve months', () => {
    const items = [
      paid('2026-09-15', 0.31),
      paid('2026-06-15', 0.3),
      paid('2025-12-15', 0.29),
      paid('2025-09-15', 0.28),
      paid('2024-12-16', 0.27),
    ]

    expect(paidPerYear(items).map(({ year, amount }) => [year, Number(amount.toFixed(2))])).toEqual(
      [
        [2026, 0.61],
        [2025, 0.57],
        [2024, 0.27],
      ],
    )
    expect(paidOverYear(items, '2026-10-30')).toBeCloseTo(0.9)
  })
})
