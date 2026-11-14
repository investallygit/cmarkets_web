import { describe, expect, it } from 'vitest'
import { comparisonRows, initialComparison, toggleCode } from './comparisonRows'

describe('comparisonRows', () => {
  it('puts each month of every series on one row, oldest first', () => {
    const rows = comparisonRows({
      from: '2026-01-01',
      to: '2026-03-01',
      series: [
        {
          code: 'BRENT',
          points: [
            { date: '2026-02-01', value: 104 },
            { date: '2026-01-01', value: 100 },
          ],
        },
        {
          code: 'WTI',
          points: [
            { date: '2026-01-01', value: 100 },
            { date: '2026-03-01', value: 97.5 },
          ],
        },
      ],
      correlations: [
        [1, 0.97],
        [0.97, 1],
      ],
    })
    expect(rows).toEqual([
      { date: '2026-01-01', BRENT: 100, WTI: 100 },
      { date: '2026-02-01', BRENT: 104 },
      { date: '2026-03-01', WTI: 97.5 },
    ])
  })
})

describe('the series compared', () => {
  it('start with the commodity and its reference series', () => {
    expect(initialComparison('BRENT', 'WTI')).toEqual(['BRENT', 'WTI'])
    expect(initialComparison('COCOA', null)).toEqual(['COCOA'])
  })

  it('take five at most and always keep the series of the profile', () => {
    expect(toggleCode(['BRENT'], 'WTI', 'BRENT', 5)).toEqual(['BRENT', 'WTI'])
    expect(toggleCode(['BRENT', 'WTI'], 'WTI', 'BRENT', 5)).toEqual(['BRENT'])
    expect(toggleCode(['BRENT', 'WTI'], 'BRENT', 'BRENT', 5)).toEqual(['BRENT', 'WTI'])
    expect(toggleCode(['A', 'B', 'C', 'D', 'E'], 'F', 'A', 5)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })
})
