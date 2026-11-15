import { describe, expect, it } from 'vitest'
import { columnTrack, isFigure, MIN_COLUMN_WIDTH } from './dataColumns'

describe('columnTrack', () => {
  it('gives a share of the width its least width, so that a narrow table scrolls', () => {
    expect(MIN_COLUMN_WIDTH).toBe(56)
    expect(columnTrack()).toBe('minmax(56px, 1fr)')
    expect(columnTrack('1.2fr')).toBe('minmax(56px, 1.2fr)')
    expect(columnTrack('.5fr')).toBe('minmax(56px, .5fr)')
  })

  it('keeps a fixed width, or a track the column sets itself', () => {
    expect(columnTrack('92px')).toBe('92px')
    expect(columnTrack('minmax(96px, 1.1fr)')).toBe('minmax(96px, 1.1fr)')
    expect(columnTrack('auto')).toBe('auto')
  })
})

describe('columnTrack, fitted to what a column holds (ROADMAP step 48)', () => {
  it('widens a share, a fixed or a least width to what the column needs, never narrows one', () => {
    expect(columnTrack('1fr', 92)).toBe('minmax(92px, 1fr)')
    expect(columnTrack('1fr', 40)).toBe('minmax(56px, 1fr)')
    expect(columnTrack('64px', 71)).toBe('71px')
    expect(columnTrack('80px', 71)).toBe('80px')
    expect(columnTrack('minmax(96px, 1fr)', 118)).toBe('minmax(118px, 1fr)')
    expect(columnTrack('auto', 118)).toBe('auto')
  })
})

describe('isFigure', () => {
  it('takes numbers, amounts, dates and times, in either language, and leaves texts out', () => {
    for (const figure of [
      '1 282,84',
      '+0.30%',
      '-0,14 %',
      '15/11 17:13',
      '16/11',
      '17:13:24',
      '300 M',
      'XAF 2.2 Bn',
      '1,282.84',
    ])
      expect(isFigure(figure)).toBe(true)
    for (const text of ['OTA CMR 3 yr 2029', 'Bank D', 'ACC-0011', '—', 'Awaiting SVTs', ''])
      expect(isFigure(text)).toBe(false)
  })
})
