import { describe, expect, it } from 'vitest'
import { columnTrack, MIN_COLUMN_WIDTH } from './dataColumns'

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
