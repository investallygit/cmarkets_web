import { describe, expect, it } from 'vitest'
import type { DebtPeriodDto, SovereignRatingDto } from '@/shared/api/contracts'
import { debtCountry, debtState, ratingPair, scheduleBars } from './debt'

const BN = 1_000_000_000

describe('debtCountry', () => {
  it('reads three letters, two or the zone, and nothing else', () => {
    expect(debtCountry('cmr')).toBe('CMR')
    expect(debtCountry('GA')).toBe('GAB')
    expect(debtCountry(' cemac ')).toBe('CEMAC')
    expect(debtCountry('FRA')).toBeNull()
    expect(debtCountry(undefined)).toBeNull()
    expect(debtState('GNQ')).toBe('GQ')
    expect(debtState('CEMAC')).toBeNull()
  })
})

describe('scheduleBars', () => {
  const periods: DebtPeriodDto[] = [
    { kind: 'quarter', year: 2026, quarter: 4, bta: 300 * BN, ota: 160 * BN },
    { kind: 'year', year: 2027, quarter: null, bta: 460 * BN, ota: 230 * BN },
    { kind: 'year', year: 2028, quarter: null, bta: 0, ota: 560 * BN },
    { kind: 'beyond', year: 2033, quarter: null, bta: 0, ota: 180 * BN },
  ]

  it('labels the quarters of the year, the years and the years beyond, in billions', () => {
    const bars = scheduleBars(periods, (quarter, year) => `Q${quarter} ${String(year).slice(2)}`)
    expect(bars.map((bar) => bar.label)).toEqual(['Q4 26', '2027', '2028', '2033+'])
    expect(bars[0]).toEqual({ label: 'Q4 26', bta: 300, ota: 160, total: 460 })
    expect(bars[1].total).toBe(690)
    expect(bars[3]).toEqual({ label: '2033+', bta: 0, ota: 180, total: 180 })
  })
})

describe('ratingPair', () => {
  const rating = (
    agency: SovereignRatingDto['agency'],
    value: string | null,
  ): SovereignRatingDto => ({
    agency,
    rating: value,
    outlook: value ? 'stable' : null,
    ratedOn: null,
    example: true,
  })

  it("writes S&P's and Moody's ratings as the mockup's indicator", () => {
    expect(ratingPair([rating('sp', 'B-'), rating('moodys', 'Caa1'), rating('fitch', null)])).toBe(
      'B- / Caa1',
    )
    expect(ratingPair([rating('sp', null), rating('moodys', 'Caa2'), rating('fitch', 'CCC')])).toBe(
      'Caa2',
    )
    expect(ratingPair([rating('sp', null)])).toBeNull()
    expect(ratingPair(null)).toBeNull()
  })
})
