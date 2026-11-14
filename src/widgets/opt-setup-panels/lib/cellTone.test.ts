import { describe, expect, it } from 'vitest'
import { cellTone } from './cellTone'

describe('correlation cells', () => {
  it('turn amber as the correlation rises, the panel under nought', () => {
    expect(cellTone(1).amberPct).toBe(100)
    expect(cellTone(0.8).amberPct).toBeGreaterThan(cellTone(0.55).amberPct)
    expect(cellTone(0.4).amberPct).toBeLessThan(cellTone(0.5).amberPct)
    expect(cellTone(-0.4).amberPct).toBe(0)
  })

  it('keep their figures readable: dark text on the bright band, light on the dark one', () => {
    expect(cellTone(0.5)).toMatchObject({ amberPct: 70, text: 'var(--bg-app)' })
    expect(cellTone(0.49)).toMatchObject({ text: 'var(--text-primary)' })
    expect(cellTone(0.49).amberPct).toBeLessThanOrEqual(45)
  })
})
