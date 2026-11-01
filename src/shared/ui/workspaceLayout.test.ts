import { describe, expect, it } from 'vitest'
import { compactLayout, hasPanelBelow, movePanel, placePanel, resizePanel } from './workspaceLayout'
import type { WorkspaceItem } from './Workspace'

// The market dashboard's columns, in short: indices over watchlist, chart over rates.
const LAYOUT: readonly WorkspaceItem[] = [
  { i: 'indices', x: 0, y: 0, w: 4, h: 7, minW: 3, minH: 4 },
  { i: 'chart', x: 4, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
  { i: 'watchlist', x: 0, y: 7, w: 4, h: 9, minW: 3, minH: 5 },
  { i: 'rates', x: 4, y: 10, w: 4, h: 6, minW: 3, minH: 4 },
]

const place = (layout: readonly WorkspaceItem[], id: string) => {
  const item = layout.find((candidate) => candidate.i === id)
  return item && { x: item.x, y: item.y, w: item.w, h: item.h }
}

describe('moving and sizing a panel without dragging', () => {
  it('moves a panel up past the one above, which takes its place', () => {
    const moved = movePanel(LAYOUT, 'rates', 0, -1, 12)
    expect(place(moved, 'rates')).toEqual({ x: 4, y: 0, w: 4, h: 6 })
    expect(place(moved, 'chart')).toEqual({ x: 4, y: 6, w: 4, h: 10 })
    // Moving the other one down comes to the same.
    expect(movePanel(LAYOUT, 'chart', 0, 1, 12)).toEqual(moved)
  })

  it('moves a panel a column aside, the panels in the way making room below', () => {
    const moved = movePanel(LAYOUT, 'indices', 1, 0, 12)
    expect(place(moved, 'indices')).toEqual({ x: 1, y: 0, w: 4, h: 7 })
    expect(place(moved, 'chart')?.y).toBeGreaterThanOrEqual(7)
    // Not past the edges of the grid.
    expect(place(movePanel(LAYOUT, 'indices', -1, 0, 12), 'indices')?.x).toBe(0)
  })

  it('resizes within the minimum size and the grid', () => {
    const taller = resizePanel(LAYOUT, 'indices', 0, 1, 12)
    expect(place(taller, 'indices')?.h).toBe(8)
    expect(place(taller, 'watchlist')?.y).toBe(8)
    expect(place(resizePanel(LAYOUT, 'indices', -5, -5, 12), 'indices')).toEqual({
      x: 0,
      y: 0,
      w: 3,
      h: 4,
    })
    expect(place(resizePanel(LAYOUT, 'rates', 20, 0, 12), 'rates')?.w).toBe(8)
  })

  it('knows whether a panel lies below, for Move down', () => {
    expect(hasPanelBelow(LAYOUT, 'chart')).toBe(true)
    expect(hasPanelBelow(LAYOUT, 'rates')).toBe(false)
  })
})

describe('packing and putting back', () => {
  it('packs panels up as the grid does, and a packed layout stays as it is', () => {
    const withoutChart = LAYOUT.filter((item) => item.i !== 'chart')
    expect(place(compactLayout(withoutChart, 12), 'rates')).toEqual({ x: 4, y: 0, w: 4, h: 6 })
    const packed = compactLayout(LAYOUT, 12)
    for (const item of LAYOUT) expect(place(packed, item.i)).toEqual(place(LAYOUT, item.i))
  })

  it('puts a hidden panel back at its place, the panel there making way below', () => {
    const withoutChart = compactLayout(
      LAYOUT.filter((item) => item.i !== 'chart'),
      12,
    )
    const chart = LAYOUT.find((item) => item.i === 'chart')!
    const back = placePanel(withoutChart, chart, 12)
    expect(place(back, 'chart')).toEqual({ x: 4, y: 0, w: 4, h: 10 })
    expect(place(back, 'rates')).toEqual({ x: 4, y: 10, w: 4, h: 6 })
  })
})
