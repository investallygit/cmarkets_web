import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ARRANGEMENT,
  hidePanel,
  moveStacked,
  sameLayoutName,
  showPanel,
  viewOf,
  withGrid,
  type Arrangement,
  type ScreenPanel,
} from './arrangement'

// The market dashboard's columns, in short: indices over watchlist, chart over rates.
const DEFAULTS: readonly ScreenPanel[] = [
  { i: 'indices', name: 'indices', x: 0, y: 0, w: 4, h: 7, minW: 3 },
  { i: 'chart', name: 'indexChart', x: 4, y: 0, w: 4, h: 10 },
  { i: 'watchlist', name: 'watchlistName', x: 0, y: 7, w: 4, h: 9 },
  { i: 'rates', name: 'ratesFx', x: 4, y: 10, w: 4, h: 6 },
]

const place = (arrangement: Arrangement, id: string) => {
  const item = viewOf(DEFAULTS, arrangement).layout.find((candidate) => candidate.i === id)
  return item && { x: item.x, y: item.y, w: item.w, h: item.h }
}

describe('what the screen shows', () => {
  it('shows every panel at its default place, stacked row by row', () => {
    const view = viewOf(DEFAULTS, DEFAULT_ARRANGEMENT)
    expect(view.layout.map((item) => item.i)).toEqual(['indices', 'chart', 'watchlist', 'rates'])
    expect(view.stacked).toEqual(['indices', 'chart', 'watchlist', 'rates'])
    expect(view.hidden).toEqual([])
  })

  it('keeps the stacked order saved, the panels it does not know after it', () => {
    const view = viewOf(DEFAULTS, { ...DEFAULT_ARRANGEMENT, stacked: ['rates', 'gone', 'chart'] })
    expect(view.stacked).toEqual(['rates', 'chart', 'indices', 'watchlist'])
  })

  it('never shows an empty screen, which would leave no menu to show a panel back', () => {
    const hidden = DEFAULTS.map((panel) => panel.i)
    expect(viewOf(DEFAULTS, { ...DEFAULT_ARRANGEMENT, hidden }).layout).toHaveLength(4)
  })
})

describe('hiding and showing a panel', () => {
  it('hides a panel: the panel below goes up, and it keeps its place to come back to', () => {
    const hidden = hidePanel(DEFAULTS, DEFAULT_ARRANGEMENT, 'chart')
    expect(hidden.hidden).toEqual(['chart'])
    expect(place(hidden, 'chart')).toBeUndefined()
    expect(place(hidden, 'rates')).toEqual({ x: 4, y: 0, w: 4, h: 6 })
    expect(viewOf(DEFAULTS, hidden).hidden).toEqual(['chart'])
    expect(viewOf(DEFAULTS, hidden).stacked).not.toContain('chart')

    const back = showPanel(DEFAULTS, hidden, 'chart')
    expect(back.hidden).toEqual([])
    expect(place(back, 'chart')).toEqual({ x: 4, y: 0, w: 4, h: 10 })
    expect(place(back, 'rates')).toEqual({ x: 4, y: 10, w: 4, h: 6 })
  })

  it('does not hide the last panel shown', () => {
    let arrangement = DEFAULT_ARRANGEMENT
    for (const id of ['indices', 'chart', 'watchlist']) {
      arrangement = hidePanel(DEFAULTS, arrangement, id)
    }
    expect(hidePanel(DEFAULTS, arrangement, 'rates')).toBe(arrangement)
  })

  it('takes the grid as it is for the shown panels, and keeps the place of the hidden ones', () => {
    const hidden = hidePanel(DEFAULTS, DEFAULT_ARRANGEMENT, 'chart')
    const shown = viewOf(DEFAULTS, hidden).layout.map((item) =>
      item.i === 'rates' ? { ...item, x: 8 } : item,
    )
    const moved = withGrid(DEFAULTS, hidden, shown)
    expect(moved.items.find((item) => item.i === 'rates')?.x).toBe(8)
    expect(moved.items.find((item) => item.i === 'chart')).toEqual({
      i: 'chart',
      x: 4,
      y: 0,
      w: 4,
      h: 10,
    })
  })
})

describe('the order of the panels stacked in one column', () => {
  it('trades places with the panel above or below, past the hidden ones', () => {
    const up = moveStacked(DEFAULTS, DEFAULT_ARRANGEMENT, 'chart', -1)
    expect(viewOf(DEFAULTS, up).stacked).toEqual(['chart', 'indices', 'watchlist', 'rates'])

    const hidden = hidePanel(DEFAULTS, DEFAULT_ARRANGEMENT, 'watchlist')
    const down = moveStacked(DEFAULTS, hidden, 'chart', 1)
    expect(viewOf(DEFAULTS, down).stacked).toEqual(['indices', 'rates', 'chart'])
    // The hidden panel comes back where it was in the column.
    expect(viewOf(DEFAULTS, showPanel(DEFAULTS, down, 'watchlist')).stacked).toEqual([
      'indices',
      'rates',
      'watchlist',
      'chart',
    ])
  })

  it('stays put at either end, and leaves the grid as it is', () => {
    expect(moveStacked(DEFAULTS, DEFAULT_ARRANGEMENT, 'indices', -1)).toBe(DEFAULT_ARRANGEMENT)
    expect(moveStacked(DEFAULTS, DEFAULT_ARRANGEMENT, 'rates', 1)).toBe(DEFAULT_ARRANGEMENT)
    const up = moveStacked(DEFAULTS, DEFAULT_ARRANGEMENT, 'rates', -1)
    expect(place(up, 'rates')).toEqual({ x: 4, y: 10, w: 4, h: 6 })
  })
})

describe('the names of saved layouts', () => {
  it('compare without case or outer spaces', () => {
    expect(sameLayoutName('Morning', ' morning ')).toBe(true)
    expect(sameLayoutName('Morning', 'Evening')).toBe(false)
  })
})
