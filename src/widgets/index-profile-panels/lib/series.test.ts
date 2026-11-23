import { describe, expect, it } from 'vitest'
import { chartRows, dayOf, monthGrid, rebased } from './series'

const INDEX = [
  { day: '2026-10-26', value: 1250 },
  { day: '2026-10-27', value: 1262.5 },
  { day: '2026-10-28', value: 1275 },
]

describe('the index value chart (screen 31)', () => {
  it('rebases a series to 100 on its first day', () => {
    expect(rebased(INDEX).map((point) => point.value)).toEqual([100, 101, 102])
    expect(rebased([])).toEqual([])
    expect(dayOf('2026-10-30T13:00:00Z')).toBe('2026-10-30')
  })

  it('compares from the first day both have, the compared keeping its last value', () => {
    const rows = chartRows(
      INDEX,
      [
        { day: '2026-10-27', value: 50 },
        { day: '2026-10-29', value: 60 },
      ],
      false,
    )
    expect(rows).toEqual([
      { day: '2026-10-27', value: 100, compared: 100 },
      { day: '2026-10-28', value: (1275 / 1262.5) * 100, compared: 100 },
    ])
    expect(chartRows(INDEX, null, false)[2]!.value).toBe(1275)
    expect(chartRows(INDEX, [{ day: '2020-01-01', value: 1 }], false)[0]!.value).toBe(100)
  })

  it('lays the returns by month out a year a row, newest first', () => {
    expect(
      monthGrid([
        { year: 2025, month: 12, returnPct: 1.2 },
        { year: 2026, month: 1, returnPct: -0.5 },
        { year: 2026, month: null, returnPct: 3 },
      ]),
    ).toEqual([
      {
        year: 2026,
        months: [-0.5, null, null, null, null, null, null, null, null, null, null, null],
      },
      {
        year: 2025,
        months: [null, null, null, null, null, null, null, null, null, null, null, 1.2],
      },
    ])
  })
})
