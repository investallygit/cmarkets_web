import { describe, expect, it } from 'vitest'
import { changePctOf, nextValue, tickValues, type SampleQuote } from './liveQuotes'

const index: SampleQuote = { code: 'BVMAC-A', value: 1284.37, previousClose: 1278.98, tick: 0.01 }
const share: SampleQuote = { code: 'SEMC', value: 52500, previousClose: 51900, tick: 50 }

describe('the quotes of the picture of the terminal', () => {
  it('move by up to 0.15%, in whole ticks', () => {
    expect(nextValue(share, 52500, () => 1)).toBe(52600)
    expect(nextValue(share, 52500, () => 0)).toBe(52400)
    expect(nextValue(share, 52500, () => 0.7) % share.tick).toBe(0)
    expect(nextValue(index, 1284.37, () => 1)).toBe(1286.3)
  })

  it('stay close to the sample, however long they run', () => {
    let values = [index.value, share.value]
    for (let beat = 0; beat < 5000; beat++) values = tickValues(values, [index, share], Math.random)
    expect(Math.abs(values[0] / index.value - 1)).toBeLessThan(0.01)
    expect(Math.abs(values[1] / share.value - 1)).toBeLessThan(0.01)
  })

  it('keep the value of the quotes that do not move', () => {
    const values = [index.value, share.value]
    expect(tickValues(values, [index, share], () => 0.9)).toEqual(values)
  })

  it('show the change since the previous close', () => {
    expect(changePctOf(share, 52500)).toBeCloseTo(1.156, 3)
  })
})
