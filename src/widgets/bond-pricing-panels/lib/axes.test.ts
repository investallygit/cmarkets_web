import { describe, expect, it } from 'vitest'
import { curveWindow, priceTicks, yieldTicks } from './axes'

describe('the axes of the price-yield curve', () => {
  it('marks each whole yield of the curve, as the mockup from 3% to 9%', () => {
    expect(yieldTicks(2.7302, 8.7302)).toEqual([3, 4, 5, 6, 7, 8])
    expect(yieldTicks(-1.5, 1.5)).toEqual([-1, 0, 1])
  })

  it('rounds the price axis to a step of five intervals at most', () => {
    expect(priceTicks(93.66, 110.05)).toEqual({
      low: 92,
      high: 112,
      ticks: [92, 96, 100, 104, 108, 112],
    })
    expect(priceTicks(99.2, 100.4)).toEqual({ low: 99, high: 100.5, ticks: [99, 99.5, 100, 100.5] })
  })
})

describe('the window of the curve used', () => {
  const curve = [
    { years: 10, ratePct: 7 },
    { years: 0.25, ratePct: 4.5 },
    { years: 1, ratePct: 5 },
    { years: 5, ratePct: 6 },
  ]

  it('shows two years past the last cash flow and cuts the curve there', () => {
    expect(curveWindow(curve, [0.0137, 1.0137, 2.0137, 3.0137])).toEqual({
      high: 6,
      points: [
        { years: 0.25, ratePct: 4.5 },
        { years: 1, ratePct: 5 },
        { years: 5, ratePct: 6 },
        { years: 6, ratePct: 6.2 },
      ],
    })
  })

  it('stops at the cash flows when the curve ends before them, and shows a year at least', () => {
    expect(curveWindow([{ years: 1, ratePct: 5 }], [2.4]).high).toBe(3)
    expect(curveWindow([], [0.3])).toEqual({ high: 1, points: [] })
  })
})
