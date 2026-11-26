import { describe, expect, it } from 'vitest'
import { changeTone, coverPercent, coverTone, formatChangeBp, tenorOf } from './figures'

describe("AUC's figures (screen 33)", () => {
  it('writes the cover in percent, red below 100%', () => {
    expect([coverPercent(1.73), coverPercent(0.88), coverPercent(1)]).toEqual([173, 88, 100])
    expect([coverTone(0.88), coverTone(1), coverTone(1.48)]).toEqual(['down', 'up', 'up'])
  })

  it('writes the change from the previous auction in bp, a rise in red', () => {
    expect([4, -2, 0, null].map((bp) => formatChangeBp(bp, 'bp'))).toEqual([
      '+4 bp',
      '−2 bp',
      '0 bp',
      '',
    ])
    expect([4, -2, 0, null].map(changeTone)).toEqual(['down', 'up', 'neutral', 'neutral'])
  })

  it('names a tenor as the rates query does', () => {
    expect([tenorOf('BTA', 52), tenorOf('OTA', 5)]).toEqual(['52W', '5Y'])
  })
})
