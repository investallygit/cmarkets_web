import { describe, expect, it } from 'vitest'
import { corridorRows, yearTicks } from './corridor'

const points = [
  { date: '2019-01-01', policy: 3.5, marginalLending: 6, deposit: 0 },
  { date: '2020-03-27', policy: 3.25, marginalLending: 5, deposit: 0 },
]

describe('the BEAC corridor', () => {
  it('runs the last meeting on to today', () => {
    const rows = corridorRows(points, '2021-06-30')
    expect(rows.map((row) => row.policy)).toEqual([3.5, 3.25, 3.25])
    expect(rows.at(-1)?.time).toBe(Date.UTC(2021, 5, 30))
    expect(corridorRows(points, '2020-03-27')).toHaveLength(2)
    expect(corridorRows([], '2021-06-30')).toEqual([])
  })

  it('ticks each 1 January from the first step', () => {
    expect(yearTicks(corridorRows(points, '2021-06-30'))).toEqual([
      Date.UTC(2019, 0, 1),
      Date.UTC(2020, 0, 1),
      Date.UTC(2021, 0, 1),
    ])
  })
})
